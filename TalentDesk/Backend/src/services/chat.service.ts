import type { Role } from "@prisma/client";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { AIMessage, BaseMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { retrieveChunks } from "../rag/retriever";
import { createAppTools } from "../tools/app.tools";

const DATA_SYSTEM_PROMPT = `You are the TalentDesk assistant. Answer questions about jobs and candidates using ONLY the results of the provided tools.
Never invent numbers or names. Never write or run SQL. If a tool does not give you the answer, reply exactly: "I don't know based on the app data."
Keep the answer short and factual.`;

const DOCS_SYSTEM_PROMPT = `You answer questions from the uploaded documents only.
Use only the numbered context blocks below. Always include the source citation from the block, for example: "According to hiring-policy.pdf (page 2, chunk 3), ...".
If the answer is not present in the context, reply exactly: "I don't know based on the uploaded documents." Do not guess.`;

export interface ChatSource {
  filename: string;
  page: number | null;
  chunkIndex: number;
  citation: string;
}

export interface ChatAnswer {
  answer: string;
  sources: ChatSource[];
  mode: "data" | "docs" | "unknown";
}

export function contentText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) =>
        typeof block === "string"
          ? block
          : typeof block === "object" && block !== null && "text" in block
            ? String((block as { text: unknown }).text)
            : "",
      )
      .join("\n");
  }
  return String(content ?? "");
}

/** Simple, transparent intent router: data questions use tools, everything else uses RAG. */
function wantsAppData(question: string) {
  const lower = question.toLowerCase();
  const explicitDataVerb =
    /^(how many|count|list|show|give me|what is the total|summarize|summary of)\b/.test(lower);
  const dataSubject =
    /\b(candidate|candidates|job|jobs)\b/.test(lower) &&
    /\b(stage|applied|screened|interviewed|selected|joined|rejected|openings|status|client)\b/.test(
      lower,
    );
  return explicitDataVerb || dataSubject;
}

export async function answerQuestion(
  question: string,
  role: Role,
) {
  if (!env.GOOGLE_API_KEY) {
    throw ApiError.badRequest("GOOGLE_API_KEY is not configured on the server");
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey: env.GOOGLE_API_KEY,
    model: env.LLM_MODEL,
    temperature: 0,
  });

  if (wantsAppData(question)) {
    const tools = createAppTools(role);
    const withTools = model.bindTools(tools);
    const messages: BaseMessage[] = [
      new SystemMessage(DATA_SYSTEM_PROMPT),
      new HumanMessage(question),
    ];



    console.log("homan : ", messages)

    for (let step = 0; step < 3; step += 1) {
      const response = (await withTools.invoke(messages)) as AIMessage;
      const calls = response.tool_calls ?? [];

      if (calls.length === 0) {
        return {
          answer: contentText(response.content) || "I don't know based on the app data.",
          sources: [],
          mode: "data",
        };
      }

      messages.push(response);
      for (const call of calls) {
        console.log("call and calls : ", call , calls)
        const selected = tools.find(
          (candidate) => candidate.name === call.name,
        ) as StructuredToolInterface | undefined;
        let result: string;
        try {
          result = selected
            ? String(await selected.invoke(call.args))
            : `Unknown tool: ${call.name}`;
        } catch (error) {
          result = `Tool error: ${error instanceof Error ? error.message : String(error)}`;
        }
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: call.id ?? "",
            name: call.name,
          }),
        );
      }
    }

    return {
      answer: "I don't know based on the app data.",
      sources: [],
      mode: "unknown",
    };
  }

  const chunks = await retrieveChunks(question, 5);
  console.log("chunks: ", chunks)
  if (chunks.length === 0) {
    return {
      answer: "I don't know based on the uploaded documents.",
      sources: [],
      mode: "unknown",
    };
  }

  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.citation}\n${chunk.content}`)
    .join("\n\n");
  const response = await model.invoke([
    new SystemMessage(DOCS_SYSTEM_PROMPT),
    new HumanMessage(`Context:\n${context}\n\nQuestion: ${question}`),
  ]);

  return {
    answer: contentText(response.content),
    sources: chunks.map(({ filename, page, chunkIndex, citation }) => ({
      filename,
      page,
      chunkIndex,
      citation,
    })),
    mode: "docs",
  };
}
