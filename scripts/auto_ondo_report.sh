#!/bin/bash
#===============================================================================
# Ondo 美股日报 - 全自动生成脚本 (Cron 版)
# 
# 用法：
#   手动运行：bash ~/auto_ondo_report.sh
#   测试模式：bash ~/auto_ondo_report.sh --test（跳过周末检查）
#   Cron 定时：0 9 * * 1-5 /bin/bash $HOME/auto_ondo_report.sh
#
# 前置条件：
#   1. Claude Code 已安装（claude 命令可用）
#   2. Playwright MCP 已配置浏览器登录态（Grok + ChatGPT）
#   3. .env 中 FMP_API_KEY 和 MASSIVE_API_KEY 已配置
#===============================================================================

set -euo pipefail

#--- 参数解析 -----------------------------------------------------------------
TEST_MODE=false
for arg in "$@"; do
    case "$arg" in
        --test) TEST_MODE=true ;;
    esac
done
#--- 参数解析结束 -------------------------------------------------------------

#--- 配置区 -------------------------------------------------------------------
PROJECT_DIR="/path/to/ondo-daily-report-generator"
REPORT_DIR="/path/to/ondo-daily-report-generator/reports"
LOG_DIR="/path/to/ondo-daily-report-generator/logs"
TODAY=$(date +"%Y-%m-%d")
WEEKDAY=$(date +%u)  # 1=周一, 7=周日

# Claude Code 路径（cron 环境 PATH 可能不全，显式指定）
# 如果 claude 不在这个路径，运行 `which claude` 找到实际路径后替换
CLAUDE_BIN="/opt/homebrew/bin/claude"

# 超时时间（秒）- 日报生成通常需要 15-30 分钟
TIMEOUT=2400  # 40 分钟

# 通知方式：macos / none
NOTIFY="macos"
#--- 配置区结束 ----------------------------------------------------------------

#--- 环境设置 ------------------------------------------------------------------
# Cron 环境 PATH 很少，需要手动补全
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

# Node.js 路径（Claude Code 依赖）
# 如果用 nvm 管理 Node，取消下面的注释并修改版本号
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 如果用 fnm 管理 Node，取消下面的注释
# eval "$(fnm env)"

# 如果用 Homebrew 安装的 Node
# export PATH="/opt/homebrew/opt/node/bin:$PATH"

# 加载项目环境变量
if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env"
    set +a
fi
#--- 环境设置结束 --------------------------------------------------------------

#--- 辅助函数 ------------------------------------------------------------------
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify() {
    local title="$1"
    local message="$2"
    
    case "$NOTIFY" in
        macos)
            osascript -e "display notification \"${message}\" with title \"${title}\"" 2>/dev/null || true
            ;;
        none)
            ;;
    esac
}

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log "❌ 脚本异常退出，exit code: $exit_code"
        notify "Ondo 日报失败" "生成过程出错，请检查日志: ${LOG_DIR}/${TODAY}.log"
    fi
}

trap cleanup EXIT
#--- 辅助函数结束 --------------------------------------------------------------

#--- 前置检查 ------------------------------------------------------------------
log "=========================================="
log "🚀 Ondo 美股日报自动生成 - ${TODAY}"
log "=========================================="

# 检查是否工作日（周一到周五）
if [ "$WEEKDAY" -gt 5 ] && [ "$TEST_MODE" = false ]; then
    log "📅 今天是周末，跳过日报生成"
    exit 0
fi

if [ "$TEST_MODE" = true ]; then
    log "🧪 测试模式：跳过周末检查"
fi

# 创建目录
mkdir -p "$REPORT_DIR" "$LOG_DIR"

# 检查 Claude Code 是否可用
if ! command -v "$CLAUDE_BIN" &>/dev/null; then
    log "❌ Claude Code 未找到，请检查 CLAUDE_BIN 路径"
    log "   当前路径: $CLAUDE_BIN"
    log "   提示: 运行 'which claude' 找到正确路径"
    notify "Ondo 日报失败" "Claude Code 未找到"
    exit 1
fi
log "✅ Claude Code: $($CLAUDE_BIN --version 2>/dev/null || echo 'found')"

# 检查项目目录
if [ ! -f "${PROJECT_DIR}/CLAUDE.md" ]; then
    log "❌ 项目目录不完整，缺少 CLAUDE.md"
    exit 1
fi
log "✅ 项目目录: ${PROJECT_DIR}"

# 检查 API Keys
if [ -z "${FMP_API_KEY:-}" ]; then
    log "⚠️ FMP_API_KEY 未设置"
fi
if [ -z "${MASSIVE_API_KEY:-}" ]; then
    log "⚠️ MASSIVE_API_KEY 未设置"
fi
#--- 前置检查结束 --------------------------------------------------------------

#--- 主流程 --------------------------------------------------------------------
log "📝 开始生成日报..."
notify "Ondo 日报" "开始生成 ${TODAY} 日报..."

cd "$PROJECT_DIR"

# 核心命令：用 Claude Code 非交互模式生成日报
# -p: print mode（非交互）
# --allowedTools: 预授权工具，避免交互确认
# --verbose: 输出详细日志（可选，调试时开启）
"$CLAUDE_BIN" -p \
"用模板帮我生成 ${TODAY} 的 Ondo 日报。

执行要求：
1. 按照 ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt 的完整流程执行
2. 这是全自动无人值守模式，没有用户可以交互，所有步骤必须自动完成
3. 【重要】阻塞点A和阻塞点B的处理方式：不要等待用户，不要生成提示词让用户手动查询，直接使用 Playwright MCP 工具自动执行：
   - 阻塞点A：用 mcp__playwright__browser_navigate 访问 https://x.com/i/grok，用 mcp__playwright__browser_snapshot 获取页面，用 mcp__playwright__browser_type 输入查询，用 mcp__playwright__browser_click 发送，等待响应后用 mcp__playwright__browser_snapshot 获取结果
   - 阻塞点B：用 mcp__playwright__browser_navigate 访问 https://chatgpt.com，同样流程自动查询
4. 如果 Playwright 遇到问题（如登录态过期、页面超时），跳过该步骤并在日报中标注「社区数据待补充」，然后继续后续步骤
5. 禁止在阻塞点使用 AskUserQuestion 工具，因为没有用户可以回答
6. 最终日报保存为 reports/ondo_daily_report_${TODAY}.md
7. 所有步骤完成后，输出「✅ 日报生成完成」" \
    --verbose --output-format stream-json \
    --allowedTools "Bash(read_only:false),Read,Write,WebSearch,Browser,mcp__*" \
    2>&1 | while IFS= read -r line; do
        # 从 stream-json 中提取进度信息
        type=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('type',''))" 2>/dev/null || echo "")
        case "$type" in
            assistant)
                msg=$(echo "$line" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for b in d.get('message',{}).get('content',[]):
    if b.get('type')=='text':
        t=b['text']
        # 只显示前100字符
        print(t[:100].replace(chr(10),' '))
        break
" 2>/dev/null || echo "")
                [ -n "$msg" ] && echo "[$(date +%H:%M:%S)] 💬 $msg"
                ;;
            result)
                msg=$(echo "$line" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('subtype',''), d.get('result','')[:80])
" 2>/dev/null || echo "")
                [ -n "$msg" ] && echo "[$(date +%H:%M:%S)] ✅ $msg"
                ;;
            tool_use)
                tool=$(echo "$line" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('tool_name','unknown'))
" 2>/dev/null || echo "unknown")
                echo "[$(date +%H:%M:%S)] 🔧 调用工具: $tool"
                ;;
            tool_result)
                echo "[$(date +%H:%M:%S)] 📦 工具返回结果"
                ;;
        esac
        # 同时写入完整日志
        echo "$line" >> "${LOG_DIR}/${TODAY}_raw.log"
    done

CLAUDE_EXIT=${PIPESTATUS[0]}
#--- 主流程结束 ----------------------------------------------------------------

#--- 结果检查 ------------------------------------------------------------------
REPORT_FILE="${REPORT_DIR}/ondo_daily_report_${TODAY}.md"

if [ $CLAUDE_EXIT -eq 124 ]; then
    log "⏰ 生成超时（超过 ${TIMEOUT} 秒）"
    notify "Ondo 日报超时" "生成超过 ${TIMEOUT} 秒，请检查日志"
    exit 1
fi

if [ $CLAUDE_EXIT -ne 0 ]; then
    log "❌ Claude Code 返回错误: exit code $CLAUDE_EXIT"
    notify "Ondo 日报失败" "Claude Code 错误，exit code: $CLAUDE_EXIT"
    exit 1
fi

# 检查日报文件是否生成
if [ -f "$REPORT_FILE" ]; then
    WORD_COUNT=$(wc -c < "$REPORT_FILE")
    log "✅ 日报已生成: ${REPORT_FILE}"
    log "   文件大小: ${WORD_COUNT} bytes"
    notify "Ondo 日报完成 ✅" "${TODAY} 日报已生成（${WORD_COUNT} bytes）"
else
    # 尝试查找可能的其他文件名
    FOUND=$(find "$REPORT_DIR" -name "*${TODAY}*" -type f 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
        log "✅ 日报已生成（文件名不同）: ${FOUND}"
        notify "Ondo 日报完成 ✅" "日报已生成: $(basename "$FOUND")"
    else
        # 也查找项目根目录
        FOUND_ROOT=$(find "$PROJECT_DIR" -maxdepth 1 -name "*${TODAY}*" -type f 2>/dev/null | head -1)
        if [ -n "$FOUND_ROOT" ]; then
            # 移动到 reports 目录
            mv "$FOUND_ROOT" "$REPORT_DIR/"
            log "✅ 日报已生成并移动到 reports/: $(basename "$FOUND_ROOT")"
            notify "Ondo 日报完成 ✅" "日报已生成"
        else
            log "⚠️ 日报文件未找到，请检查日志"
            notify "Ondo 日报" "流程已完成但未找到日报文件，请检查"
        fi
    fi
fi

log "=========================================="
log "🏁 流程结束"
log "=========================================="
