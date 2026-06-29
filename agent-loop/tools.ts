import OpenAI from "openai";

export interface ToolHandler {
  (args: Record<string, unknown>): Promise<string>;
}

export async function getCalendarEvents(date: string): Promise<string> {
  return "下午 2 點在台北 101 有一場客戶會議";
}

export async function getWeather(location: string, date: string): Promise<string> {
  return "降雨機率 80%，有午後雷陣雨";
}

export const toolSchemas: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getCalendarEvents",
      description: "取得指定日期的行事曆行程",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "日期，格式 YYYY-MM-DD",
          },
        },
        required: ["date"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "取得指定地點與日期的天氣資訊",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "地點名稱，例如：台北 101、新店區" },
          date: { type: "string", description: "日期，格式 YYYY-MM-DD" },
        },
        required: ["location", "date"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

export const handlers: Record<string, ToolHandler> = {
  getCalendarEvents: async (args) => {
    const { date } = args as { date: string };
    return getCalendarEvents(date);
  },
  getWeather: async (args) => {
    const { location, date } = args as { location: string; date: string };
    return getWeather(location, date);
  },
};
