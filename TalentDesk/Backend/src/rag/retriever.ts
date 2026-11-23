import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createEmbeddings } from "./embeddings";

export interface RetrievedChunk {
  content: string;
  filename: string;
  page: number | null;
  chunkIndex: number;
  similarity: number;
  citation: string;
}

interface RawChunk {
  content: string;
  filename: string;
  page: number | null;
  chunkIndex: number;
  similarity: number;
}

export async function retrieveChunks(
  question: string,
  topK = 5,
  minSimilarity = 0.35,
) {
  const queryVector = await createEmbeddings().embedQuery(question);
  console.log("Query Vector: ", queryVector)
  console.log("Question : ", question)
  if (!queryVector.length) return [];

  const vectorLiteral = `[${queryVector.join(",")}]`;
  const rows = await prisma.$queryRaw<RawChunk[]>(Prisma.sql`
    SELECT
      dc."content",
      d."originalName" AS filename,
      dc."page",
      dc."chunkIndex",
      1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM "document_chunks" dc
    JOIN "documents" d ON d."id" = dc."documentId"
    WHERE dc.embedding IS NOT NULL AND d."status"::text = 'READY'
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `);

  return rows
    .map((row) => {
      const similarity = Number(row.similarity);
      const location = row.page ? `page ${row.page}` : `chunk ${row.chunkIndex + 1}`;
      return {
        content: row.content,
        filename: row.filename,
        page: row.page,
        chunkIndex: row.chunkIndex,
        similarity,
        citation: `${row.filename} (${location})`,
      };
    })
    .filter((row) => row.similarity >= minSimilarity);
}
