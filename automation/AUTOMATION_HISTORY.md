# Ondo 日报自动化任务 - 操作历史文档

> 生成时间：2026-02-06
> 目的：记录自动化配置过程，分析 API 卡断问题

---

## 一、需求确认对话

### 1.1 时间选择
**用户问**：日报在每天几点生成合适？

**我的分析**：
- 美东 17:00-18:00 → 北京 06:00-07:00（追求时效）
- 美东 20:00-21:00 → 北京 09:00-10:00（数据最完整）
- 美东次日 06:00 → 北京 19:00-20:00（晚间复盘）

**用户选择**：北京时间 09:00

### 1.2 方案确认
**用户问**：那就9点自动为我生成一份吧，如何呢？

**我的回复**：解释了挑战（需要 Claude 会话、浏览器登录、交互操作），提出三种方案：
- A. 每日提醒（低自动化）
- B. 快捷命令（中自动化）
- C. 全自动脚本（高自动化）

**用户选择**：全自动方案

### 1.3 细节确认

| 确认项 | 用户选择 |
|--------|---------|
| 通知方式 | macOS 弹窗通知 |
| 失败处理 | A - 弹窗通知失败 + 记录日志，手动重试 |
| 执行时间 | 北京时间 09:00 |

---

## 二、技术方案

### 2.1 架构设计
```
┌─────────────────┐
│  launchd        │  每天 09:00 自动触发
│  (macOS定时器)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  启动脚本        │  run_daily_report.sh
│  (新建)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude Code    │  非交互模式执行
│  claude -p      │  "生成今日日报"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  日报文件        │  ondo_daily_report_YYYY-MM-DD.md
│  + 通知         │  (完成后弹窗通知)
└─────────────────┘
```

### 2.2 文件结构
```
~/Desktop/ondo-daily-report-generator/
├── automation/                      # 新建目录
│   ├── run_daily_report.sh         # 启动脚本
│   └── logs/                        # 日志目录
│
~/Library/LaunchAgents/
└── com.ondo.daily-report.plist     # 定时任务配置
```

---

## 三、操作步骤记录

### 步骤1：创建目录结构 ✅

**执行命令**：
```bash
mkdir -p /path/to/ondo-daily-report-generator/automation/logs
```

**结果**：成功

**验证**：
```bash
ls -la /path/to/ondo-daily-report-generator/automation/
# 输出：
# drwxr-xr-x   3 r99  staff    96  2月  6 10:47 .
# drwxr-xr-x   2 r99  staff    64  2月  6 10:47 logs
```

---

### 步骤2：创建启动脚本 ✅

**文件**：`/path/to/ondo-daily-report-generator/automation/run_daily_report.sh`

**脚本内容**：
```bash
#!/bin/bash
#
# Ondo 日报自动生成脚本
# 每天北京时间 09:00 由 launchd 触发
#

# 配置
PROJECT_DIR="/path/to/ondo-daily-report-generator"
LOG_DIR="${PROJECT_DIR}/automation/logs"
CLAUDE_PATH="/opt/homebrew/bin/claude"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/daily_report_${DATE}.log"

# 确保日志目录存在
mkdir -p "${LOG_DIR}"

# 记录开始时间
echo "========================================" >> "${LOG_FILE}"
echo "开始生成日报: $(date '+%Y-%m-%d %H:%M:%S')" >> "${LOG_FILE}"
echo "========================================" >> "${LOG_FILE}"

# 切换到项目目录
cd "${PROJECT_DIR}"

# 清理可能残留的浏览器进程
pkill -f "Google Chrome for Testing" 2>/dev/null || true
sleep 1

# 执行 Claude Code 生成日报
"${CLAUDE_PATH}" -p "生成今日日报" \
    --dangerously-skip-permissions \
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
```

**执行命令**：
```bash
chmod +x /path/to/ondo-daily-report-generator/automation/run_daily_report.sh
```

**结果**：成功

---

### 步骤3：创建 launchd 配置 ✅

**文件**：`$HOME/Library/LaunchAgents/com.ondo.daily-report.plist`

**配置内容**：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ondo.daily-report</string>

    <key>ProgramArguments</key>
    <array>
        <string>/path/to/ondo-daily-report-generator/automation/run_daily_report.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>WorkingDirectory</key>
    <string>/path/to/ondo-daily-report-generator</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>

    <key>StandardOutPath</key>
    <string>/path/to/ondo-daily-report-generator/automation/logs/launchd_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/path/to/ondo-daily-report-generator/automation/logs/launchd_stderr.log</string>

    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
```

**结果**：成功

---

### 步骤4：加载定时任务 ✅

**执行命令**：
```bash
launchctl load $HOME/Library/LaunchAgents/com.ondo.daily-report.plist
```

**结果**：成功（无输出）

**验证命令**：
```bash
launchctl list | grep ondo
# 输出：-    0    com.ondo.daily-report
```

---

### 步骤5：手动测试 ⏸️ 用户中断

**执行命令**：
```bash
launchctl start com.ondo.daily-report
```

**结果**：命令已发出，但用户中断要求先生成文档

---

## 四、API 卡断问题分析

### 4.1 观察到的现象

在本次会话中，多次出现以下情况：
1. 我发送工具调用后，长时间没有响应
2. 用户多次发送 `?` 询问状态
3. 用户反馈"卡了这么久"

### 4.2 可能的原因

| 原因 | 可能性 | 说明 |
|------|--------|------|
| **Anthropic API 网络波动** | 高 | Claude 与 Anthropic 服务器之间的连接不稳定 |
| **工具执行时间过长** | 中 | 某些 Bash 命令或浏览器操作耗时 |
| **上下文过长导致响应慢** | 中 | 会话累积内容多，API 处理时间增加 |
| **本地网络问题** | 低 | 用户测试 `curl https://api.anthropic.com` |

### 4.3 发生卡断的时间点

1. **步骤4 launchctl load 之后** - 命令成功但我长时间没有回复
2. **手动测试 launchctl start 之后** - 用户多次中断

### 4.4 建议排查方向

1. 检查 API 响应时间日志（如果有）
2. 确认本地网络到 api.anthropic.com 的延迟
3. 考虑拆分长会话，避免上下文过长

---

## 五、当前状态

| 项目 | 状态 |
|------|------|
| automation/ 目录 | ✅ 已创建 |
| run_daily_report.sh | ✅ 已创建，有执行权限 |
| plist 配置 | ✅ 已创建 |
| launchd 加载 | ✅ 已加载 |
| 手动测试 | ⏸️ 待进行 |

---

## 六、后续操作

1. 分析 API 卡断原因
2. 完成手动测试
3. 确认定时任务正常工作
4. （可选）添加更多错误处理和重试逻辑
