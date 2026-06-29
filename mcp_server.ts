/**
 * MCP Weather Server — 使用 @modelcontextprotocol/sdk 實作 (McpServer)
 *
 * Installation:
 *   npm install @modelcontextprotocol/sdk
 *
 * Run:
 *   tsx mcp_server.ts
 *
 * 此 Server 透過 stdio 通訊，可被 MCP Client (如 Claude Desktop) 啟動。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

function main() {
  const server = new McpServer(
    { name: "weather-server", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "get_weather",
    {
      description: "取得指定地點的目前天氣資訊",
      inputSchema: {
        location: z.string().describe("地點名稱，例如：新店區、台北市、東京"),
      },
    },
    async ({ location }) => ({
      content: [
        {
          type: "text" as const,
          text: `${location}今日降雨機率 80%，有午後雷陣雨`,
        },
      ],
    }),
  );

  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error("MCP Weather Server 已啟動 (stdio)");
}

main();
