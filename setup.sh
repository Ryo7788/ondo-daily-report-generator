#!/bin/bash
#===============================================================================
# Ondo 美股日报生成器 - 一键部署脚本
#
# 用法：
#   git clone https://github.com/<your-username>/ondo-daily-report-generator.git
#   cd ondo-daily-report-generator
#   bash setup.sh
#
# 功能：
#   1. 检查系统环境（macOS、Node.js、Claude Code）
#   2. 配置 API Keys（FMP + Polygon）
#   3. 安装 Web 面板依赖
#   4. 生成并注册 launchd 定时任务（每日 9:00 AM）
#   5. 冒烟测试
#===============================================================================

set -euo pipefail

#--- 变量 ---------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
PLIST_LABEL="com.ondo.daily-report"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
LAUNCHD_LOG_DIR="/tmp/ondo-daily-report"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

step=0
total_steps=7

#--- 辅助函数 -----------------------------------------------------------------
header() {
    step=$((step + 1))
    echo ""
    echo -e "${BOLD}[$step/$total_steps] $1${NC}"
    echo "────────────────────────────────────────"
}

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; }
info() { echo -e "  ${CYAN}→${NC} $*"; }

ask_yes_no() {
    local prompt="$1"
    local default="${2:-y}"
    local yn
    if [ "$default" = "y" ]; then
        read -p "  $prompt [Y/n]: " yn
        yn="${yn:-y}"
    else
        read -p "  $prompt [y/N]: " yn
        yn="${yn:-n}"
    fi
    [[ "$yn" =~ ^[Yy] ]]
}

#--- 开始 ---------------------------------------------------------------------
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  Ondo 美股日报生成器 - 一键部署${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "  项目目录: $PROJECT_DIR"
echo "  当前用户: $(whoami)"
echo "  系统架构: $(uname -m)"

#==============================================================================
# Step 1: 系统环境检查
#==============================================================================
header "检查系统环境"

# macOS
if [[ "$(uname)" != "Darwin" ]]; then
    fail "仅支持 macOS（launchd 定时任务依赖 macOS）"
    exit 1
fi
ok "macOS $(sw_vers -productVersion)"

# Node.js
if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    ok "Node.js $NODE_VERSION"
else
    fail "Node.js 未安装"
    info "请先安装: brew install node"
    exit 1
fi

# npm
if command -v npm &>/dev/null; then
    ok "npm $(npm --version)"
else
    fail "npm 未安装"
    exit 1
fi

# Claude Code
CLAUDE_BIN=$(command -v claude 2>/dev/null || echo "")
if [ -z "$CLAUDE_BIN" ]; then
    for p in /opt/homebrew/bin/claude /usr/local/bin/claude "$HOME/.npm-global/bin/claude"; do
        [ -x "$p" ] && CLAUDE_BIN="$p" && break
    done
fi

if [ -n "$CLAUDE_BIN" ]; then
    CLAUDE_VERSION=$("$CLAUDE_BIN" --version 2>/dev/null || echo "unknown")
    ok "Claude Code: $CLAUDE_BIN ($CLAUDE_VERSION)"
else
    warn "Claude Code 未安装"
    if ask_yes_no "是否现在安装？（npm install -g @anthropic-ai/claude-code）"; then
        info "正在安装 Claude Code..."
        npm install -g @anthropic-ai/claude-code
        CLAUDE_BIN=$(command -v claude 2>/dev/null || echo "")
        if [ -n "$CLAUDE_BIN" ]; then
            ok "Claude Code 安装成功: $CLAUDE_BIN"
        else
            fail "安装失败，请手动安装后重试"
            exit 1
        fi
    else
        fail "Claude Code 是必要依赖，请手动安装后重试"
        exit 1
    fi
fi

# 项目完整性
if [ ! -f "${PROJECT_DIR}/CLAUDE.md" ]; then
    fail "项目不完整，缺少 CLAUDE.md"
    exit 1
fi
if [ ! -f "${PROJECT_DIR}/ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt" ]; then
    fail "项目不完整，缺少模板文件"
    exit 1
fi
ok "项目文件完整"

#==============================================================================
# Step 2: Claude Code 账号登录
#==============================================================================
header "Claude Code 账号登录"

echo "  日报生成依赖 Claude Code（Anthropic 的 AI CLI 工具）。"
echo "  每位用户需要用自己的 Anthropic 账号登录。"
echo ""

# 检查是否已登录：用一个最小化的请求测试
info "检查登录状态..."
if "$CLAUDE_BIN" -p "hi" --max-turns 1 &>/dev/null; then
    ok "Claude Code 已登录，账号可用"
else
    warn "Claude Code 未登录或账号不可用"
    echo ""
    echo "  请在弹出的交互流程中完成登录："
    echo "  （通常选择 Anthropic 账号 → 浏览器授权）"
    echo ""
    if ask_yes_no "是否现在运行 'claude login'？"; then
        "$CLAUDE_BIN" login
        # 验证登录结果
        echo ""
        if "$CLAUDE_BIN" -p "hi" --max-turns 1 &>/dev/null; then
            ok "登录成功"
        else
            warn "登录似乎未完成，后续可手动运行: claude login"
        fi
    else
        warn "跳过登录。后续请手动运行: claude login"
    fi
fi

#==============================================================================
# Step 3: 配置 API Keys
#==============================================================================
header "配置 API Keys（需要你自己的 Key）"

echo "  日报生成需要调用两个金融数据 API，每位用户需要注册自己的免费 Key。"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  FMP（指数/商品/财报）  免费 250次/天                   │"
echo "  │  注册地址: https://financialmodelingprep.com/developer  │"
echo "  │                                                         │"
echo "  │  Polygon（个股/ETF）    免费 5次/分钟                   │"
echo "  │  注册地址: https://polygon.io                           │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""

ENV_FILE="${PROJECT_DIR}/.env"
CLAUDE_CONFIG="${PROJECT_DIR}/.claude/settings.local.json"

mkdir -p "${PROJECT_DIR}/.claude"

# 检查是否已有配置
if [ -f "$ENV_FILE" ]; then
    warn "检测到已有配置: $ENV_FILE"
    # 读取现有值
    EXISTING_FMP=$(grep "^FMP_API_KEY=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "")
    EXISTING_POLY=$(grep "^MASSIVE_API_KEY=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "")
    if [ -n "$EXISTING_FMP" ] && [ -n "$EXISTING_POLY" ]; then
        ok "FMP_API_KEY: ${EXISTING_FMP:0:8}..."
        ok "MASSIVE_API_KEY: ${EXISTING_POLY:0:8}..."
        if ! ask_yes_no "是否重新配置？" "n"; then
            ok "保留现有配置"
            FMP_KEY="$EXISTING_FMP"
            POLYGON_KEY="$EXISTING_POLY"
            SKIP_API_WRITE=true
        fi
    fi
fi

if [ "${SKIP_API_WRITE:-}" != "true" ]; then
    echo "  请输入你的 API Key（回车跳过保留空值）："
    echo ""
    read -p "  FMP_API_KEY: " FMP_KEY
    echo ""
    read -p "  MASSIVE_API_KEY (Polygon): " POLYGON_KEY

    # 写入 .env
    cat > "$ENV_FILE" <<EOF
# Ondo 美股日报生成器 - API Keys
# 由 setup.sh 自动生成，请勿提交到 Git

MASSIVE_API_KEY=${POLYGON_KEY}
FMP_API_KEY=${FMP_KEY}
EOF
    ok "已写入 $ENV_FILE"

    # 写入 .claude/settings.local.json
    cat > "$CLAUDE_CONFIG" <<EOF
{
  "env": {
    "MASSIVE_API_KEY": "${POLYGON_KEY}",
    "FMP_API_KEY": "${FMP_KEY}"
  },
  "permissions": {
    "allow": [
      "Skill(market-status)",
      "Skill(fmp)",
      "Skill(commodity)",
      "Skill(earnings)",
      "Skill(ondo-tokens)",
      "Skill(massive)",
      "Bash(curl:*)",
      "Bash(python3:*)",
      "Bash(jq:*)",
      "WebSearch",
      "mcp__playwright__browser_navigate",
      "mcp__playwright__browser_wait_for",
      "mcp__playwright__browser_close",
      "mcp__playwright__browser_snapshot",
      "mcp__playwright__browser_type",
      "mcp__playwright__browser_click",
      "mcp__playwright__browser_run_code",
      "mcp__playwright__browser_press_key",
      "mcp__playwright__browser_take_screenshot",
      "mcp__playwright__browser_install",
      "mcp__playwright__browser_evaluate",
      "mcp__playwright__browser_console_messages",
      "WebFetch(domain:raw.githubusercontent.com)",
      "Bash(pkill:*)",
      "Bash(ls:*)",
      "Bash(open:*)"
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["playwright"]
}
EOF
    ok "已写入 $CLAUDE_CONFIG"
fi

#==============================================================================
# Step 4: 安装 Web 面板依赖
#==============================================================================
header "安装 Web 面板依赖"

if [ -d "${PROJECT_DIR}/web/node_modules" ]; then
    ok "web/node_modules 已存在"
    if ask_yes_no "是否重新安装？" "n"; then
        info "正在安装..."
        (cd "${PROJECT_DIR}/web" && npm install)
        ok "安装完成"
    else
        ok "跳过"
    fi
else
    info "正在安装 web 依赖（首次可能需要 1-2 分钟）..."
    (cd "${PROJECT_DIR}/web" && npm install)
    ok "安装完成"
fi

#==============================================================================
# Step 5: 创建必要目录
#==============================================================================
header "创建目录结构"

mkdir -p "${PROJECT_DIR}/reports"
mkdir -p "${PROJECT_DIR}/logs"
mkdir -p "$LAUNCHD_LOG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

ok "reports/ - 日报输出目录"
ok "logs/ - 执行日志目录"
ok "$LAUNCHD_LOG_DIR - launchd 日志（/tmp 避免 TCC 限制）"

# 确保脚本可执行
chmod +x "${PROJECT_DIR}/scripts/auto_ondo_report.sh"
chmod +x "${PROJECT_DIR}/scripts/test_trigger.sh"
ok "脚本已设为可执行"

#==============================================================================
# Step 6: 配置 launchd 定时任务
#==============================================================================
header "配置 launchd 定时任务"

SCHEDULE_HOUR=9
SCHEDULE_MIN=0

echo "  默认调度时间：每个工作日 ${SCHEDULE_HOUR}:$(printf '%02d' $SCHEDULE_MIN)"
if ask_yes_no "是否修改调度时间？" "n"; then
    read -p "  请输入小时 (0-23): " SCHEDULE_HOUR
    read -p "  请输入分钟 (0-59): " SCHEDULE_MIN
fi

# 卸载旧的 plist（如果存在）
if launchctl list "$PLIST_LABEL" &>/dev/null 2>&1; then
    warn "检测到已有 launchd 任务，先卸载"
    launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
fi

# 生成 plist（路径全部动态化）
cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PROJECT_DIR}/scripts/auto_ondo_report.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>${SCHEDULE_HOUR}</integer>
        <key>Minute</key>
        <integer>${SCHEDULE_MIN}</integer>
    </dict>

    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>${HOME}</string>
    </dict>

    <key>StandardOutPath</key>
    <string>${LAUNCHD_LOG_DIR}/launchd_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LAUNCHD_LOG_DIR}/launchd_stderr.log</string>

    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
PLIST

ok "已生成: $PLIST_PATH"

# 注册 launchd
if ask_yes_no "是否立即注册 launchd 定时任务？"; then
    launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
    if launchctl list "$PLIST_LABEL" &>/dev/null 2>&1; then
        ok "launchd 任务已注册"
    else
        warn "注册可能失败，请手动检查: launchctl list $PLIST_LABEL"
    fi
else
    info "跳过注册。手动注册命令："
    info "launchctl bootstrap gui/\$(id -u) $PLIST_PATH"
fi

#==============================================================================
# Step 7: 冒烟测试
#==============================================================================
header "冒烟测试"

ERRORS=0

# 测试 API Key
if [ -n "${FMP_KEY:-}" ]; then
    info "测试 FMP API..."
    FMP_RESP=$(curl -s --connect-timeout 10 "https://financialmodelingprep.com/stable/quote?symbol=%5EGSPC&apikey=${FMP_KEY}" 2>/dev/null || echo "FAIL")
    if echo "$FMP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d[0]['symbol']" 2>/dev/null; then
        ok "FMP API 正常"
    else
        warn "FMP API 异常（Key 可能无效或额度用完）"
        ERRORS=$((ERRORS + 1))
    fi
else
    warn "FMP_API_KEY 未设置，跳过测试"
    ERRORS=$((ERRORS + 1))
fi

if [ -n "${POLYGON_KEY:-}" ]; then
    info "测试 Polygon API..."
    POLY_RESP=$(curl -s --connect-timeout 10 "https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=${POLYGON_KEY}" 2>/dev/null || echo "FAIL")
    if echo "$POLY_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='OK'" 2>/dev/null; then
        ok "Polygon API 正常"
    else
        warn "Polygon API 异常（Key 可能无效）"
        ERRORS=$((ERRORS + 1))
    fi
else
    warn "MASSIVE_API_KEY 未设置，跳过测试"
    ERRORS=$((ERRORS + 1))
fi

# 测试 Claude Code
info "测试 Claude Code..."
if "$CLAUDE_BIN" -p "echo hello" --max-turns 1 &>/dev/null; then
    ok "Claude Code 响应正常"
else
    warn "Claude Code 无响应（可能需要先登录: claude login）"
    ERRORS=$((ERRORS + 1))
fi

# Web 构建测试
info "测试 Web 面板构建..."
if (cd "${PROJECT_DIR}/web" && npm run build &>/dev/null); then
    ok "Web 面板构建成功"
else
    warn "Web 面板构建失败（不影响日报生成）"
    ERRORS=$((ERRORS + 1))
fi

#==============================================================================
# 完成
#==============================================================================
echo ""
echo -e "${BOLD}================================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}  部署完成！所有检查通过${NC}"
else
    echo -e "${YELLOW}${BOLD}  部署完成！$ERRORS 项警告${NC}"
fi
echo -e "${BOLD}================================================${NC}"
echo ""
echo "  日报目录:  ${PROJECT_DIR}/reports/"
echo "  日志目录:  ${PROJECT_DIR}/logs/"
echo "  调度时间:  每天 ${SCHEDULE_HOUR}:$(printf '%02d' $SCHEDULE_MIN)"
echo "  launchd:   $PLIST_PATH"
echo ""
echo -e "${BOLD}常用命令：${NC}"
echo ""
echo "  # 手动生成日报（测试模式）"
echo "  bash ${PROJECT_DIR}/scripts/test_trigger.sh now"
echo ""
echo "  # 用 Claude Code 交互式生成"
echo "  cd ${PROJECT_DIR} && claude"
echo "  > 用模板帮我生成今天的 Ondo 日报"
echo ""
echo "  # 启动 Web 面板"
echo "  cd ${PROJECT_DIR}/web && npm run dev"
echo ""
echo "  # 查看 launchd 状态"
echo "  launchctl list ${PLIST_LABEL}"
echo ""
echo -e "${BOLD}首次使用提醒：${NC}"
echo ""
echo "  1. 如未登录 Claude Code，先运行: claude login"
echo "  2. Playwright 需要登录 X.com（Grok）和 ChatGPT"
echo "     首次生成日报时会弹出浏览器窗口，手动登录一次即可"
echo ""
