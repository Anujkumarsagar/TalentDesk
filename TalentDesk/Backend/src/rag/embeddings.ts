import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "../config/env";

/** Shared embedding client; dimensionality must match the vector(768) column. */
export function createEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    model: env.EMBEDDING_MODEL,
    outputDimensionality: env.EMBEDDING_DIMENSIONS,
  });
}
