import OpenAI from "openai";
import "dotenv/config";
import { runAgentLoop } from "./loop";

async function main() {
  const client = new OpenAI();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "你不知道使用者的行程地點。務必先呼叫 getCalendarEvents 確認下午行程與地點，再根據地點呼叫 getWeather 查天氣。",
    },
    { role: "user", content: `我明天（${dateStr}）下午出門需要帶傘嗎？` },
  ];

  await runAgentLoop(client, messages);
}

main().catch(console.error);
