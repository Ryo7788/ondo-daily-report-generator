---
name: fmp
description: FMP API 查询美股指数（SPX/DJI/IXIC/RUT/VIX）。个股/ETF 用 /massive。
argument-hint: "<index> [history] [date]"
---

# FMP 指数行情

$ARGUMENTS

## Ticker 映射

| 简称 | FMP Ticker | 免费 |
|------|-----------|------|
| SPX | ^GSPC | ✅ |
| IXIC | ^IXIC | ✅ |
| DJI | ^DJI | ✅ |
| RUT | ^RUT | ✅ |
| VIX | ^VIX | ✅ |
| NDX | ^NDX | ❌ 付费 |

## API（stable 端点）

- 报价: `/stable/quote?symbol={ticker}&apikey=${FMP_API_KEY}`
- 历史: `/stable/historical-price-eod/full?symbol={ticker}&from={date}&to={date}&apikey=${FMP_API_KEY}`

API Key 从 `.env` 的 `FMP_API_KEY` 读取。

## ⚠️ 关键限制

- **批量查询（多 symbol 逗号分隔）在免费计划返回 "Premium Query Parameter" 错误，必须逐个单独请求**
- `^` 需 URL 编码为 `%5E`
- 免费 250 次/天，15 分钟延迟
- 使用 stable 端点，不用旧版 `/api/v3/*`
