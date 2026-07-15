import OpenAI from "openai";
import "dotenv/config";
import { runEvaluatorOptimizer } from "./evaluator-optimizer";

async function main() {
  const client = new OpenAI();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const query = `我明天（${dateStr}）下午出門需要帶傘嗎？`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "你不知道使用者的行程和天氣資訊，請使用可用的工具來取得所需資料。",
    },
    { role: "user", content: query },
  ];

  await runEvaluatorOptimizer(client, query, messages);
}

main().catch(console.error);
