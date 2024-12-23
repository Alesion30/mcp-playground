<link
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  rel="stylesheet"
/>

# My MCP Example

|name|description|
|---|---|
|[openai-mcp-host](./apps/openai-mcp-host/)|OpenAIを用いたMCPホスト|
|[weather-server](./apps/weather-server/)|天気を取得するMCPサーバー|

※ サードパーティ製のMCPサーバー集: https://github.com/modelcontextprotocol/servers

## Getting Started

```sh
$ npm install
$ npm run build
```

初めての方は、まず[weather-server](./apps/weather-server/README.md)を動かしてみることをおすすめする。

## MCP(Model Context Protocol)

MCPは、アプリケーションがLLMにコンテキストを提供する方法を標準化したオープンプロトコルである。これはAIアプリケーション用のUSB-Cポートのようなもので、AIモデルと様々なデータソースやツールを標準的な方法で接続することを可能にする。

```mermaid
flowchart LR
  User(fa:fa-user User)
  Client["""
  Host with MCP Client
  (Claude, IDEs, Tools)
  """]

  ServerA["MCP Server A"]
  ServerB["MCP Server B"]
  ServerC["MCP Server C"]

  DB1["Local Data Source A"]
  DB2["Local Data Source B"]
  Services["Remote Services"]

  subgraph Local Computer
  User <--> Client
  Client <--> |MCP Protocol| ServerA
  Client <--> |MCP Protocol| ServerB
  Client <--> |MCP Protocol| ServerC

  ServerA <--> DB1
  ServerB <--> DB2
  end

  subgraph Internet
  ServerB <--> |Web APIs| Services
  ServerC <--> |Web APIs| Services
  end
```

参考: https://modelcontextprotocol.io/introduction


実際は、Claude DesktopのようなMCPホストの裏側では、Function Callingを駆使しつつ、MCPクライアントとMCPサーバー間をやりとりしているに過ぎない。Function Callingのプロトコルを管理するMCPクライアントと実際の外部処理を行うMCPサーバーで責務を分けることがMCPの考えにおいて肝となる。基本的にはMCPクライアントとMCPサーバーは1対1の関係となり、MCPホストが複数のMCPクライアントを束ねる形を取る。

下記の図でいうと、tool一覧を取得したり（`request(list/tools)`）、toolからサーバーの関数を実行する（`request(call/tool)`）部分がMCPであると言える。

```mermaid
flowchart LR
  User(fa:fa-user User)

  GenerationAI["""
  Generation AI
  (Claude, GPT, Gemini...)
  """]

  ClientA["MCP Client A"]
  ClientB["MCP Client B"]
  ClientC["MCP Client C"]

  ServerA_list["MCP Server A - ListTools"]
  ServerA_call["MCP Server A - CallTool"]
  ServerB["MCP Server B"]
  ServerC["MCP Server C"]

  DB["Local Data Source"]
  Services["Remote Services"]

  subgraph "Internet(GenerationAI)"
  GenerationAI
  end

  subgraph Local Computer
  User <--> Host

  subgraph Host
  ClientA
  ClientB
  ClientC
  end

  subgraph ServerA["MCP Server A"]
  ServerA_list
  ServerA_call
  end

  ServerA_call <--> DB

  ClientA --> |"request(list/tools)"| ServerA_list
  ServerA_list --> |tools| ClientA
  ClientB <--> ServerB
  ClientC <--> ServerC

  Host --> |tools| GenerationAI
  GenerationAI --> |calls| Host

  ClientA --> |"request(call/tool)"| ServerA_call
  ServerA_call --> |result| ClientA
  end

  subgraph Internet
  ServerA_call <--> Services
  end

```

### 【補足】 Function Calling

```mermaid
flowchart LR
  Server["Server"]
  OpenAI["OpenAI API"]

  Function1["Function A"]
  Function2["Function B"]
  Function3["Function C"]
  DB["Local Data Source"]
  Services["Remote Services"]

  subgraph Local Computer
  subgraph S["Application Server"]
    Server --> |calls| Condition{switch}
    Condition --> |callA| Function1
    Condition --> |callB| Function2
    Condition --> |callC| Function3
  end

  Function1 <--> DB
  Function2 <--> DB
  end

  subgraph "Internet(OpenAI)"
  Server --> |tools| OpenAI
  OpenAI --> |calls| Server
  end

  subgraph Internet
  Function2 <--> |Web APIs| Services
  Function3 <--> |Web APIs| Services
  end
```

参考: https://platform.openai.com/docs/guides/function-calling

## 参考リンク

- https://www.anthropic.com/news/model-context-protocol
- https://modelcontextprotocol.io/quickstart/server
- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/servers?tab=readme-ov-file
