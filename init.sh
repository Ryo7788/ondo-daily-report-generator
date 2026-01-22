#!/bin/bash

# Ondo 美股日报生成器 - 初始化脚本
# 用于配置 API Keys（同时支持 opencode 和 Claude Code）

set -e

echo "================================================"
echo "  Ondo 美股日报生成器 - 初始化配置"
echo "================================================"
echo ""

# 创建 .claude 目录
mkdir -p .claude

# 检查是否已存在配置文件
ENV_FILE=".env"
CLAUDE_CONFIG=".claude/settings.local.json"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  检测到已存在配置文件: $ENV_FILE"
    read -p "是否覆盖？(y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "已取消"
        exit 0
    fi
fi

echo ""
echo "请输入 API Keys（回车跳过）："
echo ""

# 获取 Polygon API Key
echo "1. Polygon API Key (用于个股/ETF 行情)"
echo "   获取地址: https://polygon.io"
read -p "   MASSIVE_API_KEY: " POLYGON_KEY

# 获取 FMP API Key  
echo ""
echo "2. FMP API Key (用于指数/商品/财报)"
echo "   获取地址: https://financialmodelingprep.com"
read -p "   FMP_API_KEY: " FMP_KEY

# 生成 .env 文件（opencode 和通用工具使用）
cat > "$ENV_FILE" << EOF
# Ondo 美股日报生成器 - API Keys
# 此文件由 init.sh 自动生成，请勿提交到 Git

MASSIVE_API_KEY=${POLYGON_KEY}
FMP_API_KEY=${FMP_KEY}
EOF

# 生成 .claude/settings.local.json（Claude Code 使用）
cat > "$CLAUDE_CONFIG" << EOF
{
  "env": {
    "MASSIVE_API_KEY": "${POLYGON_KEY}",
    "FMP_API_KEY": "${FMP_KEY}"
  }
}
EOF

echo ""
echo "================================================"
echo "✅ 配置完成！"
echo ""
echo "已生成配置文件："
echo "  - $ENV_FILE (opencode / 通用)"
echo "  - $CLAUDE_CONFIG (Claude Code)"
echo ""
echo "下一步："
echo "  1. 在此目录启动 AI 助手"
echo "  2. 输入: 用模板帮我生成今天的 Ondo 日报"
echo ""
echo "================================================"
