# Ondo Daily Report Generator

> AI 驱动的 Ondo Global Markets 美股日报自动生成系统

## 概述

本项目是一个 **全自动美股日报生成系统**，专为 [Ondo Global Markets](https://ondo.finance/) 社区设计。

**它能做什么？**
- 自动采集美股指数（标普500、纳指、道指）、个股、大宗商品实时行情
- 查询财报日历、市场开休市状态
- 验证股票是否在 Ondo 支持范围内
- 通过 Playwright 自动访问 Grok / ChatGPT 获取社区热议和深度分析
- 生成结构化、可直接发布的 Markdown 日报
- Web 管理面板查看日报、日志、手动触发
- launchd 定时任务每日自动生成

**两种使用方式**：
- **全自动**：launchd 每日定时触发，无人值守完成日报
- **交互式**：启动 Claude Code，说"生成今天的日报"，4 轮对话完成

---

## 快速部署

```bash
# 1. 克隆项目
git clone https://github.com/<your-username>/ondo-daily-report-generator.git
cd ondo-daily-report-generator

# 2. 一键部署
bash setup.sh
```

`setup.sh` 会引导你完成全部配置（约 5 分钟）：

| 步骤 | 内容 |
|------|------|
| 检查系统环境 | macOS / Node.js / Claude Code |
| Claude Code 登录 | 引导登录你自己的 Anthropic 账号 |
| 配置 API Keys | 输入你的 FMP 和 Polygon Key |
| 安装 Web 依赖 | Next.js 管理面板 |
| 配置定时任务 | launchd 每日自动生成（可自定义时间） |
| 冒烟测试 | 验证 API / Claude Code / Web 构建 |

### 前置条件

- **macOS**（launchd 定时任务依赖）
- **Node.js** ≥ 16（`brew install node`）
- **Anthropic 账号**（Claude Code 登录用）

### API Keys 获取

每位用户需要注册自己的免费 API Key：

| API | 用途 | 免费额度 | 注册地址 |
|-----|------|----------|----------|
| FMP | 指数/商品/财报 | 250次/天 | [financialmodelingprep.com](https://financialmodelingprep.com/developer) |
| Polygon | 个股/ETF 行情 | 5次/分钟 | [polygon.io](https://polygon.io) |

---

## 使用方式

### 方式一：全自动（推荐）

部署完成后 launchd 会在每个工作日定时触发，无需手动操作。

```bash
# 查看定时任务状态
launchctl list com.ondo.daily-report

# 手动触发一次测试
bash scripts/test_trigger.sh now

# 定时触发（5 分钟后）
bash scripts/test_trigger.sh +5

# 查看日志
tail -f logs/$(date +%Y-%m-%d).log
```

### 方式二：交互式

```bash
cd ondo-daily-report-generator
claude

# 输入：
用模板帮我生成今天的 Ondo 日报
```

交互流程（4 轮对话）：

```
用户: "生成今天的日报"
  ↓
AI: [数据采集] → [初稿] → [Grok 查询社区热议]
  ↓
AI: [整合社区热议] → [ChatGPT 查询深度分析]
  ↓
AI: [整合分析] → [最终验证] → ✅ 完成
```

### 方式三：Web 管理面板

```bash
cd web && npm run dev
# 访问 http://localhost:3000
```

功能：
- 仪表盘（状态总览、快捷操作）
- 日报列表（卡片式、标题预览、要点标签）
- 日报详情（Markdown 渲染、目录侧边栏、上下篇导航）
- 手动触发（即时/定时）
- 日志查看（执行日志 + launchd 日志）
- 中英文切换

---

## 项目结构

```
ondo-daily-report-generator/
├── setup.sh                           # 一键部署脚本
├── init.sh                            # API Key 配置（简化版）
├── CLAUDE.md                          # AI 助手指令
├── ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt  # 日报生成提示词
├── ONDO_DAILY_REPORT_TEMPLATE_V2.md       # 日报 Markdown 模板
│
├── scripts/
│   ├── auto_ondo_report.sh            # 全自动生成脚本（launchd 调用）
│   └── test_trigger.sh                # 测试调度器（now/+N/HH:MM/cancel）
│
├── web/                               # Next.js 管理面板
│   ├── app/                           # 页面（Dashboard/Reports/Trigger/Logs）
│   ├── app/api/                       # API 路由
│   ├── components/                    # UI 组件
│   └── lib/                           # 工具库（i18n/reports/logs）
│
├── .claude/
│   ├── settings.local.json            # Claude Code 配置 + API Keys
│   └── skills/                        # 6 个数据采集 Skills
│
├── .mcp.json                          # Playwright MCP 配置
├── reports/                           # 生成的日报
└── logs/                              # 执行日志
```

### 数据 Skills

| Skill | 用途 | 示例 |
|-------|------|------|
| `/fmp` | 指数行情（SPX/DJI/IXIC/RUT/VIX）| `/fmp SPX,DJI` |
| `/massive` | 个股/ETF 实时行情 | `/massive TSLA,AAPL` |
| `/commodity` | 大宗商品（黄金/白银） | `/commodity GOLD,SILVER` |
| `/earnings` | 财报日历 | `/earnings week` |
| `/market-status` | 市场开休市状态 | `/market-status` |
| `/ondo-tokens` | Ondo 支持的币股验证 | `/ondo-tokens check AAPL` |

---

## 常见问题

<details>
<summary>launchd 任务没有执行？</summary>

1. 检查状态：`launchctl list com.ondo.daily-report`
2. 查看日志：`cat /tmp/ondo-daily-report/launchd_stdout.log`
3. 注意：launchd 日志必须放在 `/tmp/`，macOS TCC 会阻止写入 `~/Desktop` 等受保护路径
</details>

<details>
<summary>API Key 报错？</summary>

- FMP 必须使用 stable 端点（`/stable/quote`），不要用 legacy v3
- FMP 免费计划不支持批量查询，需要逐个请求
- 重新配置：`bash setup.sh`（会检测已有配置）
</details>

<details>
<summary>Playwright 浏览器打不开？</summary>

可能是之前会话的 Chrome 进程残留：
```bash
pkill -f "Google Chrome for Testing"
```
</details>

<details>
<summary>Grok / ChatGPT 查询失败？</summary>

需要在 Playwright 浏览器里登录。首次运行日报生成时会弹出浏览器窗口，手动登录 X.com 和 ChatGPT 即可，登录态会保持在 `/tmp/mcp-chrome-profile`。
</details>

---

## 输出示例

生成的日报保存为 `reports/ondo_daily_report_YYYY-MM-DD.md`，包含：

- 今日宣发点（3 个关键话题）
- 市场全景（指数、宏观、VIX）
- 24 小时热点（6 条）
- 社区热议（X/Twitter 情绪）
- 个股异动
- 板块轮动分析
- 财报与事件日历
- Ondo 投资参考
- 数据来源与参考链接

---

## 更新日志

- **2026-02-09**: 添加 `setup.sh` 一键部署，脚本路径自动检测
- **2026-02-09**: Web 面板增加中英切换、日报卡片列表、目录侧边栏
- **2026-02-06**: 添加 Next.js 管理面板（Dashboard/Reports/Trigger/Logs）
- **2026-02-06**: 添加 `--test` 模式、launchd 定时调度、macOS Dock 应用
- **2026-01-22**: 初始版本，6 个数据 Skills，交互式日报生成
