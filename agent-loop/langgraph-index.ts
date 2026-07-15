import { runLangGraphOrchestrator } from "./langgraph-orchestrator";

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const query = `我明天（${dateStr}）早上想去烏來爬山，適合嗎？`;
  const systemPrompt = "你是天氣助理。根據工具取得的資料回答問題，做出明確建議。";

  const output = await runLangGraphOrchestrator(query, systemPrompt);
  console.log(`\n=== ✅ LangGraph 最終回答 ===`);
  console.log(output);
}

main().catch(console.error);
