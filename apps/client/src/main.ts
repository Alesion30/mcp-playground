import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { createChatCompletion } from "./openai.js";

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

  await client.connect(transport);

  // 利用可能なtool一覧を取得する
  const listToolsResult = await client.request(
    { method: "tools/list" },
    ListToolsResultSchema
  );

  // MCPクライアントが返すtoolsをOPENAIのFunctionCallに必要なtoolsの形式に変換する
  const tools: ChatCompletionTool[] = listToolsResult.tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: { ...tool.inputSchema, additionalProperties: false },
    },
  }));

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "What is the weather like in New York?",
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
      // MCPサーバーのtoolを呼び出す
      const callToolResult = await client.request(
        {
          method: "tools/call",
          params: {
            name: call.function.name,
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
  console.log(JSON.stringify([...messages, result], null, 2));
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
