import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatModel,
} from "openai/resources/index.mjs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type CreateChatCompletionParams = {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  model?: ChatModel;
};

/**
 * チャットのコンプリーションを作成する
 */
export const createChatCompletion = async ({
  messages,
  tools,
  model = 'gpt-4o',
}: CreateChatCompletionParams) => {
  const response = await client.chat.completions.create({
    model,
    messages,
    tools,
  });

  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error("No message found in response.");
  }

  return message;
};
