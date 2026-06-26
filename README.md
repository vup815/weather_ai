# weather_ai

OpenAI Function Calling (Tool Use) Hello World — 天氣 Agent。

## 流程

整個交互涉及 2 次 HTTP 請求：

```
   User                Node.js (index.ts)                  OpenAI API
     │                            │                                │
     │  tsx index.ts              │                                │
     │───────────────────────────>│                                │
     │                            │                                │
     │                            │    POST/v1/chat/completions    │
     │                            │  messages: [user: "新店區天氣"]  │
     │                            │  tools: [getCurrentWeather]    │
     │                            │───────────────────────────────>│
     │                            │                                │ LLM 判斷需要查天氣
     │                            │                                │ 決定回傳 tool_calls
     │                            │                                │
     │                            │    Response: tool_calls        │
     │                            │  { name: "getCurrentWeather",  │
     │                            │    arguments: {"location":"新店區"} }
     │                            │<───────────────────────────────│
     │                            │                                │
     │                            │     解析 arguments              │
     │                            │  執行 getCurrentWeather("新店區")
     │                            │  => { temp: 24, condition: "陰天" }
     │                            │                                │
     │                            │     POST /v1/chat/completions  │
     │                            │  messages: [                   │
     │                            │    user,                       │
     │                            │    assistant (tool_calls),     │
     │                            │    tool (weather result)       │
     │                            │  ]                             │
     │                            │───────────────────────────────>│
     │                            │                                │ LLM 組織自然語言回覆
     │                            │                                │
     │                            │     Response: "陰天24度"        │
     │                            │<───────────────────────────────│
     │                            │                                │
     │  log final answer          │                                │
     │<───────────────────────────│                                │
```

## 角色 (role)

| role | 意義 |
|---|---|
| `system` / `developer` | 設定 AI 行為的系統指令 |
| `user` | 使用者的輸入 |
| `assistant` | 模型的回覆（文字或 `tool_calls`） |
| `tool` | 本地執行工具後的結果 |

## 執行

```bash
npm install openai dotenv
npm install -D typescript tsx @types/node

# 在 .env 中設定 OPENAI_API_KEY=
tsx index.ts
```
