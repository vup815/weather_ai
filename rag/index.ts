/**
 * RAG (Retrieval-Augmented Generation) Hello World
 *
 * 流程:
 *   1. 讀取 weather_rules.txt，以換行符號切割成 chunks
 *   2. 將每個 chunk 透過 text-embedding-3-small 向量化
 *   3. 使用者提問時，將問題向量化，計算與所有 chunk 的餘弦相似度
 *   4. 取出最相關的 chunk 作為 Context 注入 System Prompt
 *   5. LLM 基於 Context 回答問題
 *
 * 執行:
 *   tsx rag/index.ts
 */

import OpenAI from "openai";
import fs from "fs";
import "dotenv/config";

const CACHE_FILE = ".rag-cache.json";

// --- Step 1: Read & Chunk ---

export function loadChunks(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf-8");
  return text.split("\n").filter((chunk) => chunk.trim().length > 0);
}

// --- Step 2: Embedding with cache ---

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

// --- Step 3: Cosine Similarity ---

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findBestMatch(queryEmbedding: number[], store: { text: string; embedding: number[] }[]): string {
  let bestScore = -Infinity;
  let bestText = "";
  for (const item of store) {
    const score = cosineSimilarity(queryEmbedding, item.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestText = item.text;
    }
  }
  return bestText;
}

// --- Main ---

async function main() {
  const client = new OpenAI();

  const store = await loadOrCreateStore(client, "../weather_rules.txt");

  const query = "今天降雨量預估是 90 毫米，這樣算嚴重嗎？";
  console.log(`\n=== 使用者提問 ===\n${query}`);

  const [queryEmbedding] = await embed(client, [query]);
  const context = findBestMatch(queryEmbedding, store);
  console.log(`\n=== 檢索到的 Context ===\n${context}`);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `請根據以下氣象規則來回答使用者的問題：\n\n${context}`,
      },
      { role: "user", content: query },
    ],
  });

  console.log(`\n=== LLM 最終回答 ===`);
  console.log(response.choices[0].message.content);
}

if (require.main === module) {
  main().catch(console.error);
}
