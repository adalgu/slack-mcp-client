#!/usr/bin/env node
/**
 * Slack DM MCP Server
 * 특정 사용자에게 DM을 직접 전송하는 MCP 도구
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function sendDM(userId, message) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: userId,
      text: message,
    }),
  });
  return await response.json();
}

async function getUsers() {
  const response = await fetch("https://slack.com/api/users.list", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
    },
  });
  const data = await response.json();
  if (data.ok) {
    return data.members
      .filter(m => !m.is_bot && !m.deleted && m.id !== "USLACKBOT")
      .map(m => ({
        id: m.id,
        name: m.name,
        real_name: m.real_name || m.name,
      }));
  }
  return data;
}

const server = new Server(
  { name: "slack-dm-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "send_dm",
      description: "특정 사용자에게 Slack DM을 직접 전송합니다. channel_id에 U로 시작하는 사용자 ID를 입력하세요.",
      inputSchema: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "DM을 받을 사용자의 User ID (U로 시작, 예: U0A1F0HCEHY)",
          },
          message: {
            type: "string",
            description: "전송할 메시지 내용",
          },
        },
        required: ["user_id", "message"],
      },
    },
    {
      name: "list_users",
      description: "Slack 워크스페이스의 사용자 목록을 조회합니다.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "send_dm") {
    const result = await sendDM(args.user_id, args.message);
    return {
      content: [
        {
          type: "text",
          text: result.ok 
            ? `✅ DM 전송 성공! (user: ${args.user_id})` 
            : `❌ 전송 실패: ${result.error}`,
        },
      ],
    };
  }

  if (name === "list_users") {
    const users = await getUsers();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(users, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
