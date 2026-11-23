import "dotenv/config";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 16) throw new Error("JWT_SECRET must be at least 16 characters");

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
  LLM_MODEL: process.env.LLM_MODEL || "gemini-2.5-flash",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  // Must match the vector(768) column in prisma/schema.prisma.
  EMBEDDING_DIMENSIONS: Number(process.env.EMBEDDING_DIMENSIONS) || 768,
  PORT: Number(process.env.PORT) || 4000,
  UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB) || 10,
};
