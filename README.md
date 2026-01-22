# Ondo 美股日报生成器 - 使用教程

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [详细流程](#详细流程)
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

脚本会引导你输入 API Keys 并自动生成配置文件。

### 2. 手动配置（可选）

如果不想用脚本，可手动创建 `.claude/settings.local.json`：

```json
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

AI 会引导你完成 6 步流程，最终输出完整的日报 Markdown 文件。

---

## 详细流程

### 第一步：确认日期

AI 会询问日报对应的**北京时间**日期，自动推算美东交易日。

### 第二步：数据采集

AI 自动执行以下 Skills：

```bash
/market-status              # 市场状态
/fmp SPX,DJI,IXIC,RUT,VIX   # 指数数据
/commodity GOLD,SILVER      # 贵金属
/earnings week              # 财报日历
/ondo-tokens list           # Ondo 币股列表
```

同时搜索最近 24 小时的热点新闻。

### 第三步：生成初稿

基于模板生成日报初稿。

### 第四步：外部查询

AI 生成两个提示词，你需要分别去：

1. **Grok (X/Twitter)** - 获取社区讨论热度和代表性观点
2. **ChatGPT/OpenAI** - 获取行业热点深度分析

### 第五步：完善日报

将 Grok 和 ChatGPT 的结果告诉 AI，它会：

- 整合信息到日报对应章节
- 验证所有标的是否在 Ondo 支持范围
- 优化运营话术

### 第六步：最终验证

AI 执行验证清单：

| 验证项 | 说明 |
|--------|------|
| 数据准确性 | 价格与 API 返回一致 |
| 日期一致性 | 标题、正文、数据日期一致 |
| 新闻出处 | 每条新闻有来源和日期 |
| Ondo 标的 | 已通过 `/ondo-tokens check` |
| 占位符清理 | 无模板残留 |
| 时区标注 | 美东+北京时间 |

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
├── CLAUDE.md                           # Claude 配置
├── README.md                           # 本文件
├── ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt  # 主提示词
├── ONDO_DAILY_REPORT_TEMPLATE_V2.md    # 日报模板
└── .claude/
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

确认 `.claude/settings.local.json` 配置正确，且 API Key 有效。

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

- **2026-01-22**: 初始版本，支持 6 个 Skills
