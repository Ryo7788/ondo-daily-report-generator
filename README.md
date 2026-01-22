# Ondo Daily Report Generator

> AI 驱动的 Ondo Global Markets 美股日报生成工具

---

## 给人类用户

### 快速开始

```bash
# 1. 初始化配置（输入 API Keys）
./init.sh

# 2. 启动 AI 助手（Claude Code / opencode）
# 3. 输入：
用模板帮我生成今天的 Ondo 日报
```

### 工作流程

```
用户: "生成今天的日报"
      ↓
 AI: [数据采集] → [初稿] → [Grok提示词]
      ↓
用户: 去 Grok 查询 → 粘贴结果
      ↓
 AI: [整合社区热议] → [OpenAI提示词]
      ↓
用户: 去 ChatGPT 查询 → 粘贴结果
      ↓
 AI: [整合深度分析] → [最终验证] → ✅ 完成
```

**交互轮次**：4 轮（启动 → Grok结果 → OpenAI结果 → 完成）

### API Keys 获取

| API | 用途 | 免费额度 | 申请地址 |
|-----|------|----------|----------|
| Polygon | 个股/ETF 行情 | 5次/分，15分钟延迟 | [polygon.io](https://polygon.io) |
| FMP | 指数/商品/财报 | 250次/天 | [financialmodelingprep.com](https://financialmodelingprep.com) |

### 常见问题

<details>
<summary>API Key 报错？</summary>

确认配置文件存在且有效：
- opencode：检查 `.env`
- Claude Code：检查 `.claude/settings.local.json`

或重新运行 `./init.sh`
</details>

<details>
<summary>股票查不到？</summary>

1. 代码需大写（如 `AAPL`）
2. 可能是新上市/退市股票
</details>

<details>
<summary>指数数据失败？</summary>

FMP 免费计划不支持 NDX，用 IXIC（纳指综合）替代
</details>

### 输出文件

生成的日报：`ondo_daily_report_YYYY-MM-DD.md`

---

## 给 AI 助手

### 核心文件

| 文件 | 用途 |
|------|------|
| `ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt` | 日报生成主提示词（流程和规则）|
| `ONDO_DAILY_REPORT_TEMPLATE_V2.md` | 日报 Markdown 模板 |
| `TUTORIAL_DAILY_REPORT_EXAMPLE.md` | 完整交互示例 |

### 依赖 Skills

| Skill | 用途 | 示例 |
|-------|------|------|
| `/massive` | 个股/ETF 实时行情 | `/massive TSLA,AAPL` |
| `/fmp` | 指数行情 | `/fmp SPX,DJI,IXIC,RUT,VIX` |
| `/ondo-tokens` | Ondo 支持的币股 | `/ondo-tokens check AAPL` |
| `/earnings` | 财报日历 | `/earnings week` |
| `/commodity` | 大宗商品 | `/commodity GOLD,SILVER` |
| `/market-status` | 市场开休市 | `/market-status` |

### 环境变量

```bash
# .env 或 .claude/settings.local.json
MASSIVE_API_KEY=xxx  # Polygon API
FMP_API_KEY=xxx      # FMP API
```

### 生成流程

```
1. 确认日期 → 2. 数据采集 → 3. 生成初稿 → 4. Grok查询 → 5. OpenAI查询 → 6. 完善日报 → 7. 最终验证
```

### 关键约束

1. **Ondo 标的验证**：所有个股必须通过 `/ondo-tokens check` 验证
2. **数据来源标注**：新闻需标注来源（Reuters/CNBC/Bloomberg）
3. **时区说明**：关键时间同时标注美东和北京时间

### 目录结构

```
daily-report/
├── .env                                # API Keys（自动生成）
├── init.sh                             # 初始化脚本
├── ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt
├── ONDO_DAILY_REPORT_TEMPLATE_V2.md
├── TUTORIAL_DAILY_REPORT_EXAMPLE.md
├── ondo_daily_report_*.md              # 生成的日报
└── .claude/
    ├── settings.local.json             # Claude Code 配置
    └── skills/                         # 6 个数据 Skills
```

---

## 更新日志

- **2026-01-22**: 重构 README，分人类/AI 两部分
- **2026-01-22**: 优化交互流程，新增教程文档
- **2026-01-22**: 初始版本，支持 6 个 Skills
