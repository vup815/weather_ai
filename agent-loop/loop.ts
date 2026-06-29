import OpenAI from "openai";
import { handlers, toolSchemas } from "./tools";

export async function runAgentLoop(client: OpenAI, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], maxIterations = 5): Promise<void> {
  for (let i = 0; i < maxIterations; i++) {
    console.log(`\n=== 第 ${i + 1} 次思考 ===`);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolSchemas,
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls) {
      console.log("\n=== Agent 最終回答 ===");
      console.log(message.content);
      return;
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;

      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      console.log(`→ 呼叫工具: ${toolCall.function.name}`);
      console.log(`→ 參數:`, args);

      const handler = handlers[toolCall.function.name];
      if (!handler) {
        console.error(`未知工具: ${toolCall.function.name}`);
        continue;
      }

      const result = await handler(args);
      console.log(`→ 工具回傳: ${result}`);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}
