import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCP_WEATHER_TOOLS } from "@mcp/constants/mcp-tools.js";

const main = async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["../weather-server/dist/main.cjs"],
  });

  const client = new Client(
    {
      name: "client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.log("Connecting to server...");
  await client.connect(transport);
  console.log("Connected to server!");

  // 利用可能なtool一覧を取得する
  const tools = await client.request(
    { method: "tools/list" },
    ListToolsResultSchema
  );
  console.log("Tools:", JSON.stringify(tools, null, 2));

  // 天気予報のtoolを呼び出す
  const toolContent = await client.request(
    {
      method: "tools/call",
      params: {
        name: MCP_WEATHER_TOOLS.GET_FORECAST,
        arguments: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
    },
    CallToolResultSchema
  );
  console.log("tool content:", toolContent);
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
