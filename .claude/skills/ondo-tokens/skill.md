---
name: ondo-tokens
description: 获取 Ondo Global Markets 支持的币股列表。查询当前支持哪些代币化美股/ETF、验证某股票是否在 Ondo 支持范围内。
argument-hint: "[command] [ticker]"
---

# Ondo Tokens - 币股列表查询

获取 Ondo Global Markets 官方支持的代币化美股/ETF 列表。

## 使用方式

```bash
/ondo-tokens                     # 列出所有支持的币股（简洁表格）
/ondo-tokens list                # 同上
/ondo-tokens count               # 统计支持的币股数量
/ondo-tokens check AAPL          # 检查 AAPL 是否在支持列表中
/ondo-tokens check AAPL,TSLA,GME # 批量检查多只股票
/ondo-tokens search nvidia       # 搜索包含关键词的币股
/ondo-tokens etf                 # 只列出 ETF 类型
/ondo-tokens stock               # 只列出个股类型
```

## 数据源

**官方 Token List**（遵循 Uniswap token-lists 格式）：
```
https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json
```

## 实现步骤

### 1. 获取 Token List

```bash
curl -s "https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json"
```

### 2. 解析 JSON 结构

Token List 格式：
```json
{
  "name": "Ondo Tokenized Stocks List",
  "timestamp": "2026-01-20T00:00:00.000000Z",
  "version": { "major": 4, "minor": 0, "patch": 0 },
  "tokens": [
    {
      "chainId": 1,
      "address": "0x...",
      "name": "Apple (Ondo Tokenized)",
      "symbol": "AAPLon",
      "decimals": 18,
      "logoURI": "https://cdn.ondo.finance/tokens/logos/aaplon_160x160.png",
      "tags": ["ondo"]
    }
  ]
}
```

### 3. 提取股票代码

从 `symbol` 字段提取原始 ticker：
- `AAPLon` → `AAPL`
- `TSLAon` → `TSLA`
- `SPYon` → `SPY`

规则：移除末尾的 `on` 后缀。

### 4. 输出格式

**列表输出**（默认）:
```
Ondo Global Markets 支持的币股 (共 108 只)
更新时间: 2026-01-20

| Ticker | 代币符号 | 名称 | 类型 |
|--------|---------|------|------|
| AAPL | AAPLon | Apple | 个股 |
| TSLA | TSLAon | Tesla | 个股 |
| SPY | SPYon | SPDR S&P 500 ETF | ETF |
| QQQ | QQQon | Invesco QQQ | ETF |
...
```

**检查输出**:
```
✅ AAPL - 已支持 (AAPLon)
✅ TSLA - 已支持 (TSLAon)
❌ BRK.A - 未支持
```

**统计输出**:
```
Ondo Global Markets 币股统计
- 总数: 108
- 个股: 89
- ETF: 19
- 版本: 4.0.0
- 更新时间: 2026-01-20
```

## ETF 识别规则

以下关键词出现在 `name` 字段中视为 ETF：
- `ETF`
- `Trust`
- `iShares`
- `SPDR`
- `Invesco`
- `Vanguard`

## 用途场景

1. **日报撰写**：验证提到的个股是否在 Ondo 支持范围
2. **内容审核**：确保不推荐 Ondo 不支持的标的
3. **数据统计**：获取最新支持的币股数量
4. **搜索查询**：按关键词查找相关币股

## 注意事项

1. **数据实时性**：Token List 由 Ondo 官方维护，可能有延迟
2. **链上部署**：同一 token 可能部署在多条链（Ethereum、BSC、Solana）
3. **chainId 说明**：
   - `1` = Ethereum Mainnet
   - `56` = BNB Chain
   - `501` = Solana (如有)
