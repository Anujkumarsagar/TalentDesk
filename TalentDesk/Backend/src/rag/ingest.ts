import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse";
import { prisma } from "../config/prisma";
import { createEmbeddings } from "./embeddings";

 

async function extractPages(document: {
  path: string;
  mimeType: string;
  originalName: string;
}) {
  const isPdf =
    document.mimeType === "application/pdf" ||
    path.extname(document.originalName).toLowerCase() === ".pdf";

  if (!isPdf) {
    return [{ number: null, text: (await readFile(document.path)).toString("utf8") }];
  }

  
  const parsed = await pdfParse(await readFile(document.path));
  console.log("string: ", parsed)
  const parts = parsed.text.split("\f");
  if (parts.length > 1) {
    return parts.map((text, index) => ({ number: index + 1, text }));
  }
  // Some PDFs do not expose form feeds; chunk index is used as the citation instead.
  return [{ number: null, text: parsed.text }];
}

/** Splits, embeds and stores a document. Safe to re-run for the same document. */
export async function ingestDocument(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw new Error(`Document ${documentId} not found`);

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    await prisma.documentChunk.deleteMany({ where: { documentId } });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 900,
      chunkOverlap: 120,
    });

    const chunks: Array<{ text: string; page: number | null }> = [];
    for (const page of await extractPages(document)) {
      if (!page.text.trim()) continue;
      for (const piece of await splitter.splitText(page.text)) {
        if (piece.trim()) chunks.push({ text: piece.trim(), page: page.number });
      }
    }
    if (chunks.length === 0) throw new Error("No extractable text found in document");

    const vectors = await createEmbeddings().embedDocuments(chunks.map((chunk) => chunk.text));

    await prisma.$transaction(
      chunks.map((chunk, index) => {
        const vector = `[${(vectors[index] ?? []).join(",")}]`;
        return prisma.$executeRaw`
          INSERT INTO "document_chunks"
            ("id", "documentId", "content", "page", "chunkIndex", "embedding")
          VALUES
            (${randomUUID()}, ${documentId}, ${chunk.text}, ${chunk.page}, ${index}, ${vector}::vector)
        `;
      }),
    );

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
