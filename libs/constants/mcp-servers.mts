import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export const MCP_SERVER_TYPES = {
  /** 天気予報のMCPサーバー */
  WEATHER: "weather",
} as const;
export type MCP_SERVER_TYPES =
  (typeof MCP_SERVER_TYPES)[keyof typeof MCP_SERVER_TYPES];

/**
 * MCPサーバーのtransport
 */
export const MCP_SERVERS: {
  [key in MCP_SERVER_TYPES]: StdioClientTransport;
} = {
  [MCP_SERVER_TYPES.WEATHER]: new StdioClientTransport({
    command: "node",
    args: [require.resolve("@mcp/weather-server/dist/main.cjs")],
  }),
} as const;
