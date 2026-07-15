# Orchestrator-Worker pattern implemented (hand-written + LangGraph)

The user implemented the Orchestrator-Worker pattern in two versions:
1. **Hand-written** (`orchestrator-worker.ts`) — custom plan → execute → synthesize loop with `topoSort`, `resolveParams`, and `$id` reference syntax
2. **LangGraph** (`langgraph-orchestrator.ts`) — same logic expressed as a `StateGraph` with three nodes (`plan`, `execute`, `synthesize`) and conditional edges

Key design decisions:
- Tool schemas from `tools.ts` are the single source of truth — passed via `tools` parameter with `tool_choice: "none"`
- Planner outputs via `response_format` with JSON schema (no `submitPlan` tool needed)
- Dependencies expressed as `$<taskId>` references in params, auto-resolved during execution
- The `$` reference approach has reliability issues (LLM sometimes omits the reference) — a production system would need a more robust mechanism

**Evidence**: Both versions run successfully with `tsx`. LangGraph version eliminates the manual `topoSort` and loop control — graph handles it natively.

**Implications**: Ready to explore LangGraph more deeply (e.g., checkpointing, human-in-the-loop, parallel execution), or move to another pattern (routing, multi-agent). The user is interested in how frameworks like LangGraph simplify patterns they've now built by hand.
