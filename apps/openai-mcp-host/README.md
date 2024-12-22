# OpenAI MCP Host

OpenAIのGPTモデルを用いたMCPホスト

## Getting Started

### 1. OPEN AIのAPI KEYを発行する

https://platform.openai.com/settings/organization/api-keys

### 2. .envを作成する

.envを作成し、必要な環境変数を登録する

```sh
cp .env.example .env
```

### 3. ビルドする

```sh
$ npm run build
$ node ./dist/main.cjs -m ニューヨークの天気を教えて
```

![](./images/command-result.png)

## Architecture

```mermaid
sequenceDiagram
    MCP_CLIENT <<-->> MCP_SERVER: connect

    MCP_CLIENT ->> MCP_SERVER: request(tools/list)
    MCP_SERVER -->> MCP_CLIENT: tools

    MCP_CLIENT ->> OPENAI: user message + tools
    OPENAI -->> MCP_CLIENT: tool_calls

    MCP_CLIENT ->> MCP_SERVER: request(tools/call)
    MCP_SERVER -->> MCP_CLIENT: server result

    MCP_CLIENT ->> OPENAI: server result
    OPENAI -->> MCP_CLIENT: message
```

## 参考リンク

- https://modelcontextprotocol.io/quickstart/client
