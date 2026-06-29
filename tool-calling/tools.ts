import OpenAI from "openai";

export const weatherTool: OpenAI.Chat.Completions.ChatCompletionTool = {
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
