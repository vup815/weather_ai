import OpenAI from "openai";
import { handlers, toolSchemas } from "./tools";

export async function runAgentLoop(client: OpenAI, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], maxIterations = 5): Promise<void> {
  for (let i = 0; i < maxIterations; i++) {
    console.log(`\n=== 第 ${i + 1} 次思考 ===`);

    console.log("─ LLM Request ─");
    console.log(`  model: gpt-4o-mini`);
    console.log(`  messages: [${messages.map((m) => m.role).join(", ")}]`);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolSchemas,
    });

    const message = response.choices[0].message;
    const usage = response.usage;

    console.log("─ LLM Response ─");
    console.log(`  finish_reason: ${response.choices[0].finish_reason}`);
    console.log(`  tokens: ${usage?.total_tokens} (prompt ${usage?.prompt_tokens} + completion ${usage?.completion_tokens})`);
    if (response.model !== "gpt-4o-mini") console.log(`  actual_model: ${response.model}`);

    messages.push(message);

    if (!message.tool_calls) {
      console.log(`  content: ${message.content}`);
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
