import OpenAI from "openai";
import "dotenv/config";
import { getCurrentWeather } from "./weather";
import { weatherTool } from "./tools";

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
