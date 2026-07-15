import OpenAI from "openai";
import { handlers, toolSchemas } from "./tools";

interface Critique {
  scores: { correctness: number; completeness: number };
  issues: string[];
  needs_revision: boolean;
}

async function runReAct(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  maxIterations = 5,
): Promise<string> {
  for (let i = 0; i < maxIterations; i++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolSchemas,
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls) {
      return message.content ?? "";
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const handler = handlers[toolCall.function.name];
      if (!handler) continue;
      const result = await handler(args);
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
    }
  }
  return "無法在限制次數內完成";
}

async function evaluate(client: OpenAI, query: string, answer: string): Promise<Critique> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "你是嚴格的評審。根據評分標準評估回答。",
      },
      {
        role: "user",
        content: `問題：${query}\n\n回答：${answer}`,
      },
      {
        role: "user",
        content: `評分標準（每項 0-10 分）：
- correctness：回答是否正確使用工具結果？
- completeness：是否完整回答使用者問題？

回傳 JSON 格式：
{"scores": {"correctness": 0, "completeness": 0}, "issues": ["issue1", "issue2"], "needs_revision": true}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content ?? "{}") as Critique;
}

export async function runEvaluatorOptimizer(
  client: OpenAI,
  originalQuery: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<void> {
  console.log("\n=== Phase 1: Generate (ReAct) ===");
  const draft = await runReAct(client, messages);
  console.log(`\n📝 初稿：${draft}`);

  console.log("\n=== Phase 2: Evaluate ===");
  const critique = await evaluate(client, originalQuery, draft);
  console.log(`📊 評分：`, critique.scores);
  console.log(`⚠️  問題：`, critique.issues);

  if (!critique.needs_revision) {
    console.log(`\n=== ✅ 最終回答 ===`);
    console.log(draft);
    return;
  }

  console.log("\n=== Phase 3: Revise ===");
  messages.push({
    role: "user",
    content: `你的回答需要修正。問題：${critique.issues.join("；")}。請根據工具結果重新回答。`,
  });

  const revised = await runReAct(client, messages);
  console.log(`\n=== ✅ 最終回答（修正後）===`);
  console.log(revised);
}
