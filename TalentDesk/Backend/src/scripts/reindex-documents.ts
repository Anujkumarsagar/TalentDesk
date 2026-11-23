import { prisma } from "../config/prisma";
import { ingestDocument } from "../rag/ingest";

/** Re-embeds every document after an embedding-model or dimension change. */
async function main() {
  const documents = await prisma.document.findMany({ select: { id: true } });
  console.log(`Re-embedding ${documents.length} document(s)...`);

  let failed = 0;
  for (const document of documents) {
    try {
      await ingestDocument(document.id);
      console.log(`  ok       ${document.id}`);
    } catch (error) {
      failed += 1;
      console.error(`  failed   ${document.id}: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`Done. ${documents.length - failed} succeeded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
