---
name: ondo-tokens
description: 查询 Ondo Global Markets 支持的代币化美股/ETF 列表。
argument-hint: "[list|count|check|search|etf|stock] [ticker]"
---

# Ondo 币股列表

$ARGUMENTS

## 数据源

```
https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json
```

## 解析规则

- Token symbol 格式: `{TICKER}on`（如 `AAPLon` → `AAPL`）
- ETF 识别: name 包含 `ETF`、`Trust`、`iShares`、`SPDR`、`Invesco`、`Vanguard`
- 同一 token 可能部署在多条链（chainId: 1=Ethereum, 56=BNB Chain）

## 用途

- 日报撰写时验证个股是否在 Ondo 支持范围
- 确保不推荐 Ondo 不支持的标的
