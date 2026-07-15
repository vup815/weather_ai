# Agent 思考迴圈 (ReAct Loop)

## 檔案

| 檔案 | 說明 |
|---|---|
| `loop.ts` / `index.ts` | 基本 ReAct 迴圈 — LLM 決定何時 call tool、何時回答 |
| `evaluator-optimizer.ts` / `evaluator-index.ts` | Evaluator-Optimizer 模式 — ReAct 產出草稿後，由獨立評審 LLM 檢查品質，需要時修正 |
| `orchestrator-worker.ts` / `orchestrator-index.ts` | Orchestrator-Worker 模式 — 中央 LLM 動態拆解任務、委派給 worker、合成結果 |

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

## Orchestrator-Worker 流程

```mermaid
sequenceDiagram
    participant Planner as Planner (LLM)
    participant W1 as Worker: getWeather
    participant W2 as Worker: getCalendarEvents
    participant W3 as Worker: checkSafety
    participant Synth as Synthesizer (LLM)

    Planner->>Planner: Phase 1: Plan<br/>拆解問題 → 子任務陣列
    Note over Planner: 1. getWeather(location, date)<br/>2. getCalendarEvents(date)<br/>3. checkSafety(condition: $1, location)
    par Parallel
        Planner->>W1: Phase 2: Execute 子任務 1
        Planner->>W2: 執行子任務 2
    end
    W1-->>Planner: 降雨機率 80%，午後雷陣雨
    W2-->>Planner: 下午 2 點台北 101 會議
    Planner->>W3: 執行子任務 3 (依賴 1 → 注入 "$1")
    W3-->>Planner: ⚠️ 注意安全：有雷雨
    Planner->>Synth: Phase 3: Synthesize<br/>全部結果 → 最終回答
    Synth-->>Planner: 綜合建議
```

## 執行

```bash
# 基本 ReAct
tsx agent-loop/index.ts

# Evaluator-Optimizer
tsx agent-loop/evaluator-index.ts

# Orchestrator-Worker
tsx agent-loop/orchestrator-index.ts
```
