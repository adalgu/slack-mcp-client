# Slack MCP Client

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://github.com/tuannvm/slack-mcp-client/actions/workflows/build.yml/badge.svg)](https://github.com/tuannvm/slack-mcp-client/actions)

A production-grade bridge between Slack and [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers, enabling LLM-powered conversational agents with dynamic tool orchestration.

## Overview

Slack MCP Client connects your Slack workspace to multiple MCP servers, allowing AI assistants to interact with external tools, databases, and APIs through natural language. Built with enterprise reliability in mind, it supports multiple LLM providers, real-time tool discovery, and comprehensive observability.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Slack    │────▶│  Slack MCP Client │────▶│   MCP Servers   │
│  Workspace  │◀────│                  │◀────│  (Tools/APIs)   │
└─────────────┘     └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  LLM Providers  │
                    │ (OpenAI/Claude) │
                    └─────────────────┘
```

## Features

- **Multi-Provider LLM Support** — OpenAI, Anthropic Claude, and Ollama with seamless switching
- **Dynamic Tool Discovery** — Automatically registers tools from connected MCP servers at startup
- **Agent Mode** — LangChain-powered multi-turn conversations with reasoning capabilities
- **RAG Integration** — Built-in Retrieval-Augmented Generation with JSON and vector store backends
- **Hot Reload** — Update configuration without restarting the service
- **Enterprise Observability** — Prometheus metrics, OpenTelemetry tracing, and structured logging
- **Kubernetes Ready** — Helm chart included for production deployments

## Quick Start

### Prerequisites

- Go 1.24 or later
- Slack workspace with Bot and App tokens ([setup guide](https://api.slack.com/start/quickstart))
- At least one LLM provider API key

### Installation

```bash
git clone https://github.com/tuannvm/slack-mcp-client.git
cd slack-mcp-client
make build
```

### Configuration

Create `config.json`:

```json
{
  "version": "2.0",
  "slack": {
    "botToken": "${SLACK_BOT_TOKEN}",
    "appToken": "${SLACK_APP_TOKEN}"
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4o",
    "useNativeTools": true
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}
```

Set environment variables:

```bash
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_APP_TOKEN="xapp-..."
export OPENAI_API_KEY="sk-..."
```

### Run

```bash
./slack-mcp-client
```

Or with Docker:

```bash
docker-compose up -d
```

## Architecture

```
slack-mcp-client/
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── app/                 # Lifecycle management, hot reload
│   ├── config/              # Configuration loading & validation
│   ├── slack/               # Slack Socket Mode integration
│   ├── mcp/                 # MCP client (stdio, HTTP, SSE)
│   ├── llm/                 # LLM provider factories
│   ├── handlers/            # Tool execution bridge
│   ├── rag/                 # RAG providers & ingestion
│   ├── monitoring/          # Prometheus metrics
│   └── observability/       # OpenTelemetry, Langfuse
├── docs/                    # Extended documentation
├── examples/                # Configuration examples
├── helm-chart/              # Kubernetes deployment
└── schema/                  # JSON Schema for config validation
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Slack Client** | Socket Mode integration with BlockKit formatting |
| **MCP Manager** | Multi-transport client supporting stdio, HTTP, and SSE |
| **LLM Registry** | Factory pattern for provider management via LangChain |
| **Tool Handler** | JSON tool call parsing and execution bridge |
| **RAG System** | Document ingestion with simple JSON or vector stores |

## Configuration Reference

### LLM Providers

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-5-20241022",
    "temperature": 0.7,
    "maxTokens": 4096,
    "useNativeTools": true,
    "useAgent": true,
    "customPromptFile": "./prompts/assistant.txt"
  }
}
```

| Provider | Models | Native Tools |
|----------|--------|--------------|
| `openai` | gpt-4o, gpt-4-turbo, gpt-3.5-turbo | ✓ |
| `anthropic` | claude-sonnet-4-5-*, claude-3-* | ✓ |
| `ollama` | llama3, mistral, codellama | System prompt |

### MCP Servers

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-sqlite", "data.db"],
      "env": {
        "DB_PATH": "/data/app.db"
      }
    },
    "api-server": {
      "url": "http://localhost:8081/sse",
      "transport": "sse"
    }
  }
}
```

### RAG Configuration

```json
{
  "rag": {
    "enabled": true,
    "provider": "simple",
    "dataPath": "./knowledge.json",
    "chunkSize": 1000,
    "chunkOverlap": 200
  }
}
```

Ingest documents:

```bash
./slack-mcp-client rag ingest --source ./documents/
./slack-mcp-client rag search "quarterly report"
./slack-mcp-client rag stats
```

## Development

### Commands

```bash
make build        # Build binary
make run          # Run locally
make test         # Run tests
make lint         # Run linters
make check        # Full CI check (format, lint, vet, test)
make docker-build # Build Docker image
```

### Testing

```bash
# Unit tests
go test -v ./...

# With race detection
go test -race ./...

# Coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Adding a New LLM Provider

1. Create factory in `internal/llm/`:

```go
type MyProviderFactory struct{}

func (f *MyProviderFactory) Create(cfg config.LLMConfig) (llms.Model, error) {
    // Implementation
}

func init() {
    RegisterFactory("myprovider", &MyProviderFactory{})
}
```

2. Add configuration in `config.json`
3. Set required environment variables

### Adding MCP Servers

Add to `mcp-servers.json` or `config.json`:

```json
{
  "mcpServers": {
    "my-tool": {
      "command": "node",
      "args": ["./my-mcp-server.js"],
      "allowedTools": ["tool1", "tool2"],
      "blockedTools": ["admin_*"]
    }
  }
}
```

## Deployment

### Docker

```bash
docker build -t slack-mcp-client .
docker run -d \
  -e SLACK_BOT_TOKEN=xoxb-... \
  -e SLACK_APP_TOKEN=xapp-... \
  -e OPENAI_API_KEY=sk-... \
  -v $(pwd)/config.json:/app/config.json \
  slack-mcp-client
```

### Kubernetes (Helm)

```bash
helm install slack-mcp-client ./helm-chart/slack-mcp-client \
  --set secrets.slackBotToken=xoxb-... \
  --set secrets.slackAppToken=xapp-... \
  --set secrets.openaiApiKey=sk-...
```

## Monitoring

### Prometheus Metrics

Available at `:8080/metrics`:

| Metric | Description |
|--------|-------------|
| `slack_mcp_tool_invocations_total` | Tool call counter by name and status |
| `slack_mcp_llm_tokens_total` | Token usage by model and type |
| `slack_mcp_request_duration_seconds` | Request latency histogram |

### Logging

Structured JSON logging with configurable levels:

```json
{
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## Troubleshooting

### MCP Server Connection Issues

```bash
# Enable debug logging
./slack-mcp-client --debug --mcpdebug
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Tool not discovered | Check MCP server logs, verify `allowedTools` config |
| Slack events not received | Ensure Socket Mode is enabled in Slack app settings |
| LLM timeout | Increase `timeout` in LLM config, check API quotas |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Authors

- **gunn** — Core architecture, LLM integration
- **iron** — MCP protocol, Slack integration

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [LangChain Go](https://github.com/tmc/langchaingo) for LLM orchestration
- [slack-go](https://github.com/slack-go/slack) for Slack integration

---

<p align="center">
  Built with precision. Deployed with confidence.
</p>
