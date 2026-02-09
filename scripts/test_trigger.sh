#!/bin/bash
#===============================================================================
# Ondo 日报 - 测试调度器
#
# 在指定时间触发一次自动日报生成，验证 launchd 完整链路是否正常。
#
# 用法：
#   bash scripts/test_trigger.sh 21:30      # 今天 21:30 触发测试
#   bash scripts/test_trigger.sh +5          # 5 分钟后触发测试
#   bash scripts/test_trigger.sh now         # 立即触发（不经 launchd 调度）
#   bash scripts/test_trigger.sh cancel      # 取消已安排的测试
#===============================================================================

set -euo pipefail

# 自动检测项目目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/auto_ondo_report.sh"
LOG_DIR="${PROJECT_DIR}/logs"
# launchd 日志必须放在 /tmp，macOS TCC 会阻止 launchd 进程写入 ~/Desktop
LAUNCHD_LOG_DIR="/tmp/ondo-daily-report"
TEST_PLIST_LABEL="com.ondo.daily-report-test"
TEST_PLIST_PATH="$HOME/Library/LaunchAgents/${TEST_PLIST_LABEL}.plist"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}[test]${NC} $*"; }
ok()   { echo -e "${GREEN}[test]${NC} $*"; }
warn() { echo -e "${YELLOW}[test]${NC} $*"; }
err()  { echo -e "${RED}[test]${NC} $*"; }

usage() {
    echo "用法："
    echo "  bash $0 21:30      今天 21:30 触发测试"
    echo "  bash $0 +5         5 分钟后触发测试"
    echo "  bash $0 now        立即触发（直接运行，不经 launchd）"
    echo "  bash $0 cancel     取消已安排的测试"
    exit 1
}

# 清理已有的测试任务
cleanup_test_job() {
    if launchctl list "$TEST_PLIST_LABEL" &>/dev/null; then
        launchctl bootout "gui/$(id -u)/${TEST_PLIST_LABEL}" 2>/dev/null || true
        log "已卸载旧的测试任务"
    fi
    rm -f "$TEST_PLIST_PATH"
}

# 取消测试
cancel_test() {
    if launchctl list "$TEST_PLIST_LABEL" &>/dev/null; then
        cleanup_test_job
        ok "已取消测试任务"
    else
        warn "没有正在等待的测试任务"
    fi
    exit 0
}

# 立即运行（不经 launchd）
run_now() {
    log "直接运行 auto_ondo_report.sh --test ..."
    log "日志将输出到终端和 ${LOG_DIR}/"
    echo ""
    bash "$SCRIPT_PATH" --test
    exit $?
}

# 解析时间参数，返回 HH 和 MM
parse_time() {
    local input="$1"
    local target_hour target_min

    if [[ "$input" =~ ^\+([0-9]+)$ ]]; then
        # +N 分钟模式
        local minutes="${BASH_REMATCH[1]}"
        local target_ts=$(( $(date +%s) + minutes * 60 ))
        target_hour=$(date -r "$target_ts" +%H)
        target_min=$(date -r "$target_ts" +%M)
    elif [[ "$input" =~ ^([0-9]{1,2}):([0-9]{2})$ ]]; then
        # HH:MM 模式
        target_hour="${BASH_REMATCH[1]}"
        target_min="${BASH_REMATCH[2]}"

        # 检查时间是否已过
        local now_ts=$(date +%s)
        local target_ts=$(date -j -f "%H:%M" "${target_hour}:${target_min}" +%s 2>/dev/null)
        if [ -n "$target_ts" ] && [ "$target_ts" -le "$now_ts" ]; then
            err "时间 ${target_hour}:${target_min} 已过，请指定一个未来的时间"
            exit 1
        fi
    else
        err "无法解析时间: $input"
        usage
    fi

    # 去掉前导零（避免 bash 八进制问题）
    echo "$((10#$target_hour)) $((10#$target_min))"
}

# 创建临时 plist 并加载
schedule_test() {
    local hour=$1
    local min=$2

    cleanup_test_job

    cat > "$TEST_PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${TEST_PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_PATH}</string>
        <string>--test</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>${hour}</integer>
        <key>Minute</key>
        <integer>${min}</integer>
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
    <string>${LAUNCHD_LOG_DIR}/test_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LAUNCHD_LOG_DIR}/test_stderr.log</string>

    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
PLIST

    # 预创建 launchd 日志（必须在 /tmp，避免 TCC 权限问题）
    mkdir -p "$LAUNCHD_LOG_DIR"
    : > "${LAUNCHD_LOG_DIR}/test_stdout.log"
    : > "${LAUNCHD_LOG_DIR}/test_stderr.log"

    launchctl bootstrap "gui/$(id -u)" "$TEST_PLIST_PATH"

    local formatted_time
    formatted_time=$(printf "%02d:%02d" "$hour" "$min")

    echo ""
    ok "测试任务已安排"
    echo ""
    echo "  触发时间:  今天 ${formatted_time}"
    echo "  脚本:      ${SCRIPT_PATH} --test"
    echo "  stdout:    ${LAUNCHD_LOG_DIR}/test_stdout.log"
    echo "  stderr:    ${LAUNCHD_LOG_DIR}/test_stderr.log"
    echo ""
    log "等待触发中... 你可以关闭终端，任务会在后台由 launchd 触发"
    echo ""
    echo "其他命令："
    echo "  查看状态:  launchctl list ${TEST_PLIST_LABEL}"
    echo "  查看日志:  tail -f ${LAUNCHD_LOG_DIR}/test_stdout.log"
    echo "  取消测试:  bash $0 cancel"
    echo ""

    # 询问是否要实时监控
    read -p "是否现在开始实时监控日志？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "监控日志中... (Ctrl+C 退出监控，不影响测试任务)"
        tail -f "${LAUNCHD_LOG_DIR}/test_stdout.log" "${LAUNCHD_LOG_DIR}/test_stderr.log" 2>/dev/null || true
    fi
}

#--- 主流程 -------------------------------------------------------------------

if [ $# -lt 1 ]; then
    usage
fi

mkdir -p "$LOG_DIR"

case "$1" in
    cancel)
        cancel_test
        ;;
    now)
        run_now
        ;;
    -h|--help)
        usage
        ;;
    *)
        read -r hour min <<< "$(parse_time "$1")"
        schedule_test "$hour" "$min"
        ;;
esac
