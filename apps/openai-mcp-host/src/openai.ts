import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * チャットのコンプリーションを作成する
 */
export const createChatCompletion = async (
  messages: ChatCompletionMessageParam[],
  tools?: ChatCompletionTool[]
) => {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    tools,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error("No message found in response.");
  }

  return message;
};
