# Tool Calling — OpenAI Function Calling Hello World

## 流程

```mermaid
sequenceDiagram
    participant User as 你 (User)
    participant Client as index.ts
    participant API as OpenAI API

    User->>Client: 執行 tsx tool-calling/index.ts
    Client->>API: ① POST /v1/chat/completions<br/>messages: [user: "新店區天氣"]<br/>tools: [getCurrentWeather]
    API-->>Client: ② Response: tool_calls<br/>{ name: "getCurrentWeather",<br/>  arguments: { location: "新店區" } }
    Note over Client: ③ 解析 arguments<br/>執行 getCurrentWeather("新店區")
    Client->>API: ④ POST /v1/chat/completions<br/>messages: [user, assistant, tool]
    API-->>Client: ⑤ Response: "新店區陰天24度"
    Client->>User: 印出最終回答
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
tsx tool-calling/index.ts
```
