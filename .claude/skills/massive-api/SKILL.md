---
name: massive
description: Polygon API 查询个股/ETF 行情（AAPL/TSLA/SPY 等）。指数用 /fmp。
argument-hint: "<ticker> [bars|quote|trade] [date]"
---

# Massive (Polygon) 个股行情

$ARGUMENTS

## API 端点

| 命令 | 端点 |
|------|------|
| snapshot (默认) | `/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` |
| bars | `/v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}?adjusted=true` |
| quote | `/v2/last/quote/{ticker}` |
| trade | `/v2/last/trade/{ticker}` |

所有请求加 `?apiKey=${MASSIVE_API_KEY}`，从 `.env` 读取。

## 限制

- Basic 计划 5 次/分钟
- 免费 15 分钟延迟
- Ticker 大写（AAPL, 不是 aapl）
