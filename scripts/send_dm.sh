#!/bin/sh
# Slack DM 전송 스크립트
# 사용법: ./send_dm.sh <user_id> <message>

USER_ID="$1"
MESSAGE="$2"

if [ -z "$USER_ID" ] || [ -z "$MESSAGE" ]; then
  echo '{"error": "Usage: send_dm.sh <user_id> <message>"}'
  exit 1
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
  echo '{"error": "SLACK_BOT_TOKEN is not set"}'
  exit 1
fi

RESPONSE=$(curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{\"channel\": \"$USER_ID\", \"text\": \"$MESSAGE\"}")

echo "$RESPONSE"
