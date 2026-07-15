# Agent 思考迴圈 (ReAct Loop)

## 檔案

| 檔案 | 說明 |
|---|---|
| `loop.ts` / `index.ts` | 基本 ReAct 迴圈 — LLM 決定何時 call tool、何時回答 |
| `evaluator-optimizer.ts` / `evaluator-index.ts` | Evaluator-Optimizer 模式 — ReAct 產出草稿後，由獨立評審 LLM 檢查品質，需要時修正 |

## 基本 ReAct 流程

```mermaid
sequenceDiagram
    participant User as 你 (User)
    participant Agent as index.ts
    participant Tools as 本地工具
    participant LLM as OpenAI API

    User->>Agent: 執行 tsx agent-loop/index.ts
    Agent->>LLM: ① POST /v1/chat/completions<br/>messages: [system, user]
    LLM-->>Agent: ② tool_calls<br/>getCalendarEvents({ date })
    Agent->>Tools: ③ 執行 getCalendarEvents
    Tools-->>Agent: ④ 「下午2點在台北101」
    Agent->>LLM: ⑤ POST (含 tool 結果)
    LLM-->>Agent: ⑥ tool_calls<br/>getWeather({ location, date })
    Agent->>Tools: ⑦ 執行 getWeather
    Tools-->>Agent: ⑧ 「降雨機率80%」
    Agent->>LLM: ⑨ POST (含 tool 結果)
    LLM-->>Agent: ⑩ 無 tool_calls → 最終回答
    Agent->>User: ⑪ 「建議帶傘」
```

## Evaluator-Optimizer 流程

```mermaid
sequenceDiagram
    participant Agent as Agent (ReAct)
    participant Eval as Evaluator (LLM)
    participant User as 你

    Agent->>Agent: Phase 1: Generate<br/>ReAct loop 產出草稿
    Agent->>Eval: Phase 2: Evaluate<br/>送草稿 + 評分標準
    Eval-->>Agent: Critique (JSON)<br/>scores + issues
    alt needs_revision = true
        Agent->>Agent: Phase 3: Revise<br/>帶 issues 重新 ReAct
        Agent-->>User: 修正後回答
    else needs_revision = false
        Agent-->>User: 原始草稿
    end
```

## 執行

```bash
# 基本 ReAct
tsx agent-loop/index.ts

# Evaluator-Optimizer
tsx agent-loop/evaluator-index.ts
```
