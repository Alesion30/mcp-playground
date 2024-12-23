import { MCP_SERVER_TYPES } from "@mcp/constants/mcp-servers.mjs";

/**
 * ツール名にサーバー名のprefixを付与する
 */
export const appendServerPrefix = (
  toolName: string,
  server: MCP_SERVER_TYPES
) => `${server}_${toolName}`;

/**
 * 関数名からサーバー名のprefixを取り除く
 */
export const removeServerPrefix = (functionName: string) =>
  functionName.replace(/^[^_]+_/, "");

/**
 * prefix付きの関数名からMCPサーバー名を取得する
 */
export const getServerFromPrefix = (functionName: string): MCP_SERVER_TYPES => {
  if (functionName.startsWith(`${MCP_SERVER_TYPES.WEATHER}_`)) {
    return MCP_SERVER_TYPES.WEATHER;
  }

  throw new Error(`Unknown function name: ${functionName}`);
};
