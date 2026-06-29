import OpenAI from "openai";
import "dotenv/config";
import { embed, loadOrCreateStore } from "./embed";
import { findBestMatch } from "./search";

export { loadChunks } from "./chunk";
export { embed, loadOrCreateStore } from "./embed";
export { cosineSimilarity, findBestMatch } from "./search";

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
