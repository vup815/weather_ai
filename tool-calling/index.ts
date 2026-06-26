/**
 * Weather AI Agent - OpenAI Function Calling (Tool Use) Hello World
 *
 * Installation:
 *   npm install openai dotenv
 *   npm install -D typescript tsx @types/node
 *
 * Run:
 *   tsx tool-calling/index.ts
 *
 * Or compile first:
 *   npx tsc tool-calling/index.ts --outDir dist --module nodenext --target es2022
 *   node dist/index.js
 */

import OpenAI from "openai";
import "dotenv/config";

// --- Types ---

interface WeatherData {
  temp: number;
  condition: string;
}

// --- Mock Weather Function ---

async function getCurrentWeather(location: string): Promise<WeatherData> {
  const conditions = ["晴天", "多雲", "陰天", "小雨", "大雨", "颱風"];
  return {
    temp: Math.floor(Math.random() * 30) + 10,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
  };
}

// --- Tool Schema ---

const weatherTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "getCurrentWeather",
    description: "取得指定地點的目前天氣資訊",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "地點名稱，例如：新店區、台北市、東京",
        },
      },
      required: ["location"],
      additionalProperties: false,
    },
    strict: true,
  },
};

// --- Main ---

async function main() {
  const client = new OpenAI();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "user", content: "請問現在新店區的天氣如何？" },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: [weatherTool],
  });

  const message = response.choices[0].message;
  messages.push(message);

  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const args = JSON.parse(toolCall.function.arguments) as { location: string };

      const result = await getCurrentWeather(args.location);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    const secondResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    console.log(secondResponse.choices[0].message.content);
  }
}

main().catch(console.error);
