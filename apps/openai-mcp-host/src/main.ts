import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { createChatCompletion } from "./openai.js";
import program from "commander";
import { MCP_SERVERS, MCP_SERVER_TYPES } from "@mcp/constants/mcp-servers.mjs";
import {
  appendServerPrefix,
  getServerFromPrefix,
  removeServerPrefix,
} from "./utils/handle-server-prefix.js";

type MCP_CLIENTS = { [key in MCP_SERVER_TYPES]: Client };

// MCPサーバーに対応したMCPクライアントを定義する
const MCP_CLIENTS = Object.values(MCP_SERVER_TYPES).reduce(
  (clients, serverName) => {
    clients[serverName] = new Client(
      {
        name: `client of ${serverName}`,
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
    return clients;
  },
  {} as MCP_CLIENTS
);

const main = async () => {
  program.option("-m, --message <optionValue>", "ユーザーのメッセージ");
  const options = program.parse(process.argv);
  const userMessage = options.message;
  if (!userMessage || typeof userMessage !== "string") {
    throw new Error("No user message found.");
  }

  const listToolsResults = await Promise.allSettled(
    (Object.keys(MCP_SERVERS) as (keyof typeof MCP_SERVERS)[]).map(
      async (serverName) => {
        const mcpServer = MCP_SERVERS[serverName];
        const mcpClient = MCP_CLIENTS[serverName];
        await mcpClient.connect(mcpServer);

        // 利用可能なtool一覧を取得する
        const listToolsResult = await mcpClient.request(
          { method: "tools/list" },
          ListToolsResultSchema
        );

        // MCPクライアントが返すtoolsをOPENAIのFunctionCallに必要なtoolsの形式に変換する
        const tools: ChatCompletionTool[] = listToolsResult.tools.map(
          (tool) => ({
            type: "function",
            function: {
              name: appendServerPrefix(tool.name, serverName), // NOTE: {サーバー名}_ というprefixを追加する
              description: tool.description,
              strict: true,
              parameters: { ...tool.inputSchema, additionalProperties: false },
            },
          })
        );

        return tools;
      }
    )
  );

  // OPENAIが解釈可能な関数定義一覧
  const tools = listToolsResults
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  // ユーザーのメッセージ
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  const message = await createChatCompletion(messages, tools);
  messages.push(message);

  const toolCalls = message.tool_calls;
  if (!toolCalls) {
    throw new Error("No toolCalls found in response.");
  }

  const toolMessages: ChatCompletionMessageParam[] = await Promise.all(
    toolCalls.map(async (call) => {
      const serverName = getServerFromPrefix(call.function.name); // NOTE: {サーバー名}_ というprefix を元にMCPサーバーを特定する
      const mcpClient = MCP_CLIENTS[serverName];

      // MCPサーバーのtoolを呼び出す
      const callToolResult = await mcpClient.request(
        {
          method: "tools/call",
          params: {
            name: removeServerPrefix(call.function.name), // NOTE: {サーバー名}_ というprefixを削除する
            arguments: JSON.parse(call.function.arguments),
          },
        },
        CallToolResultSchema
      );

      if (callToolResult.isError) {
        throw new Error(`Error in tool call: ${callToolResult.error}`);
      }

      return {
        tool_call_id: call.id,
        role: "tool",
        content: callToolResult.content.map((v) => ({
          text: `${v.text}`,
          type: "text",
        })),
      };
    })
  );
  messages.push(...toolMessages);

  const result = await createChatCompletion(messages);

  // MCPクライアントをすべてcloseする
  await Promise.allSettled(
    Object.values(MCP_CLIENTS).map((client) => client.close())
  );

  console.log("OpenAI response:", result.content);
  return result.content;
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
