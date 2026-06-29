import { describe, it, expect } from "vitest";
import OpenAI from "openai";
import "dotenv/config";
import { handlers, toolSchemas } from "./tools";
import { runAgentLoop } from "./loop";

// --- Unit Tests ---

describe("Mock tool functions", () => {
  it("getCalendarEvents returns a fixed schedule", async () => {
    const result = await handlers.getCalendarEvents({ date: "2026-06-27" });
    expect(result).toContain("台北 101");
    expect(result).toContain("客戶會議");
  });

  it("getWeather returns rain forecast", async () => {
    const result = await handlers.getWeather({ location: "台北 101", date: "2026-06-27" });
    expect(result).toContain("80%");
    expect(result).toContain("雷陣雨");
  });
});

// --- Integration Test ---

describe("Agent ReAct Loop", () => {
  it("answers umbrella question after calling tools", async () => {
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

    await runAgentLoop(client, messages, 5);

    const toolResults = messages.filter((m) => m.role === "tool");
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.content).toContain("傘");
    expect(toolResults.length).toBeGreaterThanOrEqual(2);
  }, 30000);
});
