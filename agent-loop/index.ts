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
      content: "你不知道使用者的行程和天氣資訊，請使用可用的工具來取得所需資料。",
    },
    { role: "user", content: `我明天（${dateStr}）下午出門需要帶傘嗎？` },
  ];

  await runAgentLoop(client, messages);
}

main().catch(console.error);
