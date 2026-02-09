#!/bin/bash
# Ondo Reports - 启动 Web 管理面板

WEB_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
LOG_FILE="/tmp/ondo-daily-report/web-server.log"
mkdir -p /tmp/ondo-daily-report

# 检查是否已在运行
if lsof -ti:3000 >/dev/null 2>&1; then
    open "http://localhost:3000"
    exit 0
fi

# 启动 dev server
cd "$WEB_DIR"
nohup npm run dev >> "$LOG_FILE" 2>&1 &

# 等待服务启动
for i in {1..15}; do
    sleep 1
    if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
        open "http://localhost:3000"
        exit 0
    fi
done

# 超时仍打开试试
open "http://localhost:3000"
