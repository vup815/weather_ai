import "dotenv/config";
import OpenAI from "openai";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { toolSchemas, handlers } from "./tools";

interface SubTask {
  id: number;
  tool: string;
  params: Record<string, unknown>;
  deps: number[];
}

const planSchema = {
  name: "plan",
  strict: false,
  schema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            tool: { type: "string" },
            params: { type: "object" },
            deps: { type: "array", items: { type: "number" } },
          },
          required: ["id", "tool", "params", "deps"],
        },
      },
    },
    required: ["tasks"],
  },
};

const GraphState = Annotation.Root({
  query: Annotation<string>,
  systemPrompt: Annotation<string>,
  tasks: Annotation<SubTask[]>({
    reducer: (_a, b) => b,
    default: () => [],
  }),
  results: Annotation<Record<number, string>>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),
  output: Annotation<string>({
    reducer: (_a, b) => b,
    default: () => "",
  }),
});

const client = new OpenAI();

function extractRef(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^\$(\d+)/);
  return m ? Number(m[1]) : null;
}

function resolveParams(params: Record<string, unknown>, results: Record<number, string>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const refId = extractRef(value);
    resolved[key] = refId !== null ? (results[refId] ?? value) : value;
  }
  return resolved;
}

function autoSetDeps(tasks: SubTask[]): void {
  for (const task of tasks) {
    const refs: number[] = [];
    for (const value of Object.values(task.params)) {
      const refId = extractRef(value);
      if (refId !== null) refs.push(refId);
    }
    const existing = new Set(task.deps);
    for (const ref of refs) {
      if (!existing.has(ref)) task.deps.push(ref);
    }
  }
}

async function planNode(state: typeof GraphState.State): Promise<Partial<typeof GraphState.Update>> {
  console.log("\n=== Plan ===");
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a task planner. Decompose the user's question into sub-tasks. " +
          "If a sub-task needs output from another sub-task, reference it with $<taskId> in the param value. " +
          "Add that task's id to `deps` so execution waits for it. " +
          "Tasks with no dependencies can run in parallel.",
      },
      { role: "user", content: state.query },
    ],
    tools: toolSchemas,
    tool_choice: "none",
    response_format: { type: "json_schema", json_schema: planSchema },
  });

  const plan = JSON.parse(response.choices[0].message.content ?? "{}") as { tasks: SubTask[] };
  const tasks = plan.tasks.map((t) => ({
    ...t,
    tool: t.tool.replace(/^functions\./, ""),
  }));
  autoSetDeps(tasks);

  console.log(formatTasks(tasks));
  return { tasks };
}

async function executeNode(state: typeof GraphState.State): Promise<Partial<typeof GraphState.Update>> {
  const ready = state.tasks.find((t) => !(t.id in state.results) && t.deps.every((d) => d in state.results));
  if (!ready) {
    console.log("⏸️  No ready tasks, blocking");
    return {};
  }

  const params = resolveParams(ready.params, state.results);
  const handler = handlers[ready.tool];
  if (!handler) {
    console.log(`❌ Unknown tool: ${ready.tool}`);
    return {};
  }

  console.log(`▶️  Task ${ready.id}: ${ready.tool} ${JSON.stringify(params)}`);
  const result = await handler(params);
  console.log(`✅ Task ${ready.id}: ${result}`);

  return { results: { [ready.id]: result } };
}

function shouldContinue(state: typeof GraphState.State): "execute" | "synthesize" | "__end__" {
  const remaining = state.tasks.filter((t) => !(t.id in state.results));
  if (remaining.length === 0) return "synthesize";

  const blocked = remaining.filter((t) => !t.deps.every((d) => d in state.results));
  if (blocked.length === remaining.length) {
    console.log("💀 Deadlock: remaining tasks all have unmet dependencies");
    return "__end__";
  }

  return "execute";
}

async function synthesizeNode(state: typeof GraphState.State): Promise<Partial<typeof GraphState.Update>> {
  console.log("\n=== Synthesize ===");
  const resultSummary = Object.entries(state.results)
    .map(([id, r]) => `子任務 ${id}: ${r}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: state.systemPrompt },
      { role: "user", content: state.query },
      {
        role: "user",
        content: `以下是各子任務的結果：\n${resultSummary}\n\n請根據以上結果回答使用者的問題。`,
      },
    ],
  });

  const output = response.choices[0].message.content ?? "";
  console.log(`\n✅ ${output}`);
  return { output };
}

function formatTasks(tasks: SubTask[]): string {
  return tasks
    .map((t) => `  ${t.id}. [${t.tool}] deps=[${t.deps.join(",")}] params=${JSON.stringify(t.params)}`)
    .join("\n");
}

const graph = new StateGraph(GraphState)
  .addNode("plan", planNode)
  .addNode("execute", executeNode)
  .addNode("synthesize", synthesizeNode)
  .addEdge(START, "plan")
  .addEdge("plan", "execute")
  .addConditionalEdges("execute", shouldContinue, {
    execute: "execute",
    synthesize: "synthesize",
    __end__: END,
  })
  .addEdge("synthesize", END)
  .compile();

export async function runLangGraphOrchestrator(query: string, systemPrompt: string): Promise<string> {
  const result = await graph.invoke({ query, systemPrompt });
  return result.output;
}
