# Ondo Daily Report Generator

> 🤖 AI 驱动的 Ondo Global Markets 美股日报生成工具

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [详细流程](#详细流程)
- [交互示例](#交互示例)
- [Skills 使用指南](#skills-使用指南)
- [环境配置](#环境配置)
- [常见问题](#常见问题)

---

## 简介

本工具用于快速生成 Ondo Global Markets 每日美股日报，集成了多个数据源 Skill，可自动获取：

- 📈 美股指数行情（标普500、纳指、道指、罗素2000）
- 💰 个股/ETF 实时数据
- 🥇 大宗商品（黄金、白银）
- 📅 财报日历
- 🏦 市场开休市状态
- ✅ Ondo 支持的币股列表

---

## 快速开始

### 1. 运行初始化脚本

```bash
cd daily-report
./init.sh
```

脚本会引导你输入 API Keys 并自动生成配置文件：
- `.env` — opencode 和通用工具使用
- `.claude/settings.local.json` — Claude Code 使用

### 2. 手动配置（可选）

如果不想用脚本，可手动创建配置文件：

**方式 A: .env 文件（推荐，通用）**
```bash
# .env（项目根目录）
MASSIVE_API_KEY=your_polygon_api_key
FMP_API_KEY=your_fmp_api_key
```

**方式 B: Claude Code 配置**
```json
// .claude/settings.local.json
{
  "env": {
    "MASSIVE_API_KEY": "your_polygon_api_key",
    "FMP_API_KEY": "your_fmp_api_key"
  }
}
```

### 3. 启动日报生成

在 `daily-report` 目录下，对 AI 说：

```
用模板帮我生成今天的 Ondo 日报
```

### 4. 按提示完成

AI 会引导你完成 7 步流程，最终输出完整的日报 Markdown 文件。

---

## 详细流程

### 第一步：确认日期

AI 自动确认日报对应的**北京时间**日期，推算美东交易日。

### 第二步：数据采集（AI 自动执行）

AI 自动调用 API 获取：
- 市场状态、指数数据、贵金属、财报日历、Ondo 币股列表
- 最近 24 小时热点新闻

### 第三步：生成初稿

基于模板生成日报初稿，社区热议部分待补充。

### 第四步：获取 Grok 社区数据

AI 输出 **Grok 提示词**，你需要：
1. 复制提示词
2. 打开 [Grok](https://grok.x.ai) 粘贴查询
3. 将 Grok 返回结果粘贴回 AI

### 第五步：获取 OpenAI 深度分析

AI 整合 Grok 数据后，输出 **OpenAI 提示词**，你需要：
1. 复制提示词
2. 打开 [ChatGPT](https://chat.openai.com) 粘贴查询
3. 将 ChatGPT 返回结果粘贴回 AI

### 第六步：完善日报

AI 整合所有外部数据，补充风险提示，优化运营话术。

### 第七步：最终验证

AI 执行验证清单：

| 验证项 | 说明 |
|--------|------|
| 数据准确性 | 价格与 API 返回一致 |
| 日期一致性 | 标题、正文、数据日期一致 |
| 新闻出处 | 每条新闻有来源和时间戳 |
| Ondo 标的 | 已通过验证 |
| 占位符清理 | 无模板残留 |
| 时区标注 | 美东+北京时间 |

---

## 交互示例

完整的交互流程示例请参考：[TUTORIAL_DAILY_REPORT_EXAMPLE.md](./TUTORIAL_DAILY_REPORT_EXAMPLE.md)

**简化流程图**：

```
用户: "生成今天的日报"
        ↓
   AI: [数据采集] → [初稿] → [Grok提示词]
        ↓
用户: 去 Grok 查询 → [粘贴结果]
        ↓
   AI: [整合社区热议] → [OpenAI提示词]
        ↓
用户: 去 ChatGPT 查询 → [粘贴结果]
        ↓
   AI: [整合深度分析] → [最终验证] → ✅ 完成
```

**交互轮次**：4 轮（启动 → Grok结果 → OpenAI结果 → 完成）

---

## Skills 使用指南

### `/massive` - 个股/ETF 行情

```bash
/massive TSLA                    # 单股快照
/massive AAPL,MSFT,NVDA          # 批量查询
/massive AAPL bars 2026-01-01    # 历史 K 线
/massive AAPL quote              # 最新报价
```

### `/fmp` - 指数行情

```bash
/fmp SPX                         # 标普500
/fmp SPX,DJI,IXIC,RUT            # 批量指数
/fmp VIX                         # 恐慌指数
/fmp SPX history 2026-01-21      # 历史数据
```

**支持的指数**：SPX、DJI、IXIC、RUT、VIX

### `/ondo-tokens` - Ondo 币股

```bash
/ondo-tokens                     # 列出所有
/ondo-tokens list                # 同上
/ondo-tokens count               # 统计数量
/ondo-tokens check AAPL,TSLA     # 验证支持
/ondo-tokens search nvidia       # 搜索
/ondo-tokens etf                 # 只看 ETF
```

### `/earnings` - 财报日历

```bash
/earnings                        # 本周财报
/earnings week                   # 同上
/earnings today                  # 今日财报
/earnings 2026-01-22             # 指定日期
/earnings NFLX                   # 单股查询
```

### `/commodity` - 大宗商品

```bash
/commodity                       # 黄金+白银（默认）
/commodity GOLD                  # 黄金
/commodity SILVER                # 白银
/commodity GOLD,SILVER,OIL       # 批量
```

### `/market-status` - 市场状态

```bash
/market-status                   # 今日状态
/market-status 2026-01-20        # 指定日期
/market-status week              # 本周日历
/market-status holidays          # 全年休市
```

---

## 环境配置

### API Keys 获取

| API | 用途 | 免费额度 | 申请地址 |
|-----|------|----------|----------|
| Polygon | 个股/ETF 行情 | 5次/分，15分钟延迟 | [polygon.io](https://polygon.io) |
| FMP | 指数/商品/财报 | 250次/天 | [financialmodelingprep.com](https://financialmodelingprep.com) |

### 目录结构

```
daily-report/
├── .env                                # API Keys（自动生成，勿提交 Git）
├── CLAUDE.md                           # Claude 配置
├── README.md                           # 本文件
├── init.sh                             # 初始化脚本
├── ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt  # 主提示词
├── ONDO_DAILY_REPORT_TEMPLATE_V2.md    # 日报模板
├── TUTORIAL_DAILY_REPORT_EXAMPLE.md    # 交互流程教程
├── ondo_daily_report_YYYY-MM-DD.md     # 生成的日报（按日期命名）
└── .claude/
    ├── settings.local.json             # Claude Code 配置（自动生成）
    └── skills/
        ├── massive-api/                # Polygon API
        ├── fmp-api/                    # FMP 指数 API
        ├── ondo-tokens/                # Ondo 币股列表
        ├── earnings-api/               # 财报日历
        ├── commodity-api/              # 大宗商品
        └── market-status/              # 市场状态
```

---

## 常见问题

### Q: API Key 报错怎么办？

确认配置文件存在且 API Key 有效：
- opencode 用户：检查 `.env` 文件
- Claude Code 用户：检查 `.claude/settings.local.json`

或重新运行 `./init.sh` 配置。

### Q: 某只股票查不到数据？

1. 检查股票代码是否正确（需大写，如 `AAPL`）
2. 可能是新上市或退市股票，API 暂不支持

### Q: 指数数据获取失败？

FMP 免费计划不支持 NDX（纳指100），请使用 IXIC（纳指综合）替代。

### Q: 如何验证股票是否在 Ondo 支持？

```bash
/ondo-tokens check AAPL,TSLA,GME
```

会返回每只股票的支持状态。

### Q: 日报生成后如何修改？

直接编辑生成的 `ondo_daily_report_YYYY-MM-DD.md` 文件即可。

---

## 更新日志

- **2026-01-22**: 优化交互流程，Grok/OpenAI 分两次获取；新增交互教程文档
- **2026-01-22**: 初始版本，支持 6 个 Skills
