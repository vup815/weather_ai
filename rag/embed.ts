import OpenAI from "openai";
import fs from "fs";
import { loadChunks } from "./chunk";

const CACHE_FILE = ".rag-cache.json";

export async function embed(client: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map((item) => item.embedding);
}

export async function loadOrCreateStore(client: OpenAI, filePath: string): Promise<{ text: string; embedding: number[] }[]> {
  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as { chunks: string[]; embeddings: number[][] };
    console.log(`→ 從快取載入 ${cached.chunks.length} 筆向量`);
    return cached.chunks.map((text, i) => ({ text, embedding: cached.embeddings[i] }));
  }

  const chunks = loadChunks(filePath);
  const embeddings = await embed(client, chunks);
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ chunks, embeddings }));
  console.log(`→ 完成 ${chunks.length} 筆向量化，已快取至 ${CACHE_FILE}`);
  return chunks.map((text, i) => ({ text, embedding: embeddings[i] }));
}
