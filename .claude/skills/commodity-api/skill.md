---
name: commodity
description: FMP API 查询大宗商品（黄金/白银/原油等）。
argument-hint: "[symbol]"
---

# 大宗商品行情

$ARGUMENTS

默认查询黄金+白银。

## Symbol 映射

| 简称 | FMP Symbol | 单位 |
|------|-----------|------|
| GOLD | GCUSD | 美元/盎司 |
| SILVER | SIUSD | 美元/盎司 |
| PLATINUM | PLUSD | 美元/盎司 |
| PALLADIUM | PAUSD | 美元/盎司 |
| OIL/WTI | CLUSD | 美元/桶 |
| BRENT | BZUSD | 美元/桶 |
| NATGAS | NGUSD | 美元/MMBtu |
| CORN | ZCUSD | WHEAT→KEUSD, SOYBEAN→ZSUSD, COFFEE→KCUSD |

## API

- 报价: `/stable/quote?symbol={symbol}&apikey=${FMP_API_KEY}`
- 批量: 多 symbol 逗号分隔（商品批量查询可用）
- 历史: `/api/v3/historical-price-full/{symbol}?apikey=${FMP_API_KEY}`

## 限制

- 免费 250 次/天，15 分钟延迟
- 商品几乎 24 小时交易
