#!/bin/bash
#
# Ondo 日报自动生成脚本
# 使用 Claude Code -p 模式
#

# 环境变量
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="$HOME"

# 配置
PROJECT_DIR="/path/to/ondo-daily-report-generator"
LOG_DIR="${PROJECT_DIR}/automation/logs"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/daily_report_${DATE}.log"

# 确保日志目录存在
mkdir -p "${LOG_DIR}"

# 记录开始时间
echo "========================================" >> "${LOG_FILE}"
echo "开始生成日报: $(date '+%Y-%m-%d %H:%M:%S')" >> "${LOG_FILE}"
echo "========================================" >> "${LOG_FILE}"

# 切换到项目目录（确保读取 CLAUDE.md 和 skill 配置）
cd "${PROJECT_DIR}"

# 清理可能残留的浏览器进程
pkill -f "Google Chrome for Testing" 2>/dev/null || true
sleep 1

# 执行 Claude Code 生成日报
claude -p "生成今日日报" \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep,WebSearch,WebFetch,mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_type,mcp__playwright__browser_wait_for,mcp__playwright__browser_close,mcp__playwright__browser_run_code,mcp__playwright__browser_press_key" \
    >> "${LOG_FILE}" 2>&1

# 检查执行结果
EXIT_CODE=$?
REPORT_FILE="${PROJECT_DIR}/ondo_daily_report_${DATE}.md"

if [ $EXIT_CODE -eq 0 ] && [ -f "${REPORT_FILE}" ]; then
    echo "日报生成成功: ${REPORT_FILE}" >> "${LOG_FILE}"
    osascript -e "display notification \"日报已生成: ondo_daily_report_${DATE}.md\" with title \"Ondo 日报\" sound name \"Glass\""
else
    echo "日报生成失败，退出码: ${EXIT_CODE}" >> "${LOG_FILE}"
    osascript -e "display notification \"日报生成失败，请查看日志\" with title \"Ondo 日报\" sound name \"Basso\""
fi

# 记录结束时间
echo "========================================" >> "${LOG_FILE}"
echo "结束时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "${LOG_FILE}"
echo "========================================" >> "${LOG_FILE}"
