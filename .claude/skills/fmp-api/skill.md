---
name: fmp
description: 获取美股指数行情数据（SPX/DJI/IXIC/RUT/VIX等）。支持指数快照、历史日K线。当需要查询指数点位、涨跌幅时使用此skill。
argument-hint: "<index> [command] [date]"
---

> **使用边界**: 本 skill 仅用于 **指数** 行情查询（SPX、DJI、IXIC、RUT、VIX）。
> 如需查询 **个股/ETF**（AAPL、TSLA、SPY 等），请使用 `/massive` skill。

# FMP API 指数行情数据获取

从 Financial Modeling Prep API 获取美股指数数据。

## 使用方式

```bash
/fmp SPX                         # 获取标普500最新报价
/fmp SPX,NDX,DJI,RUT             # 批量获取多个指数报价
/fmp SPX history 2026-01-21      # 获取SPX指定日期的日K线
/fmp SPX history 2026-01-15 2026-01-21  # 获取SPX日期范围的日K线
```

## 支持的指数

| 简称 | FMP Ticker | 名称 | 免费计划 |
|------|------------|------|---------|
| SPX | ^GSPC | 标普500指数 | ✅ |
| IXIC | ^IXIC | 纳斯达克综合指数 | ✅ |
| DJI | ^DJI | 道琼斯工业平均指数 | ✅ |
| RUT | ^RUT | 罗素2000指数 | ✅ |
| VIX | ^VIX | CBOE波动率指数（恐慌指数） | ✅ |
| NDX | ^NDX | 纳斯达克100指数 | ❌ (需付费) |

## 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `quote` (默认) | 指数最新报价 | `/fmp SPX` |
| `history` | 历史日K线数据 | `/fmp SPX history 2026-01-21` |

## 参数说明

$ARGUMENTS

## 实现步骤

### 1. 环境变量检查

从项目 .env 或环境变量获取 API Key：
```bash
# 自动加载项目级 .env 文件
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

API_KEY="${FMP_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: FMP_API_KEY 未配置"
    echo "请运行 ./init.sh 配置 API Key"
    exit 1
fi
```

### 2. Ticker 映射

将简称转换为 FMP ticker：
| 输入 | FMP Ticker |
|------|------------|
| SPX | ^GSPC |
| NDX | ^NDX |
| IXIC | ^IXIC |
| DJI | ^DJI |
| RUT | ^RUT |
| VIX | ^VIX |

### 3. API调用（使用 stable 端点）

**指数报价** (默认)
```bash
# 单个指数
curl -s "https://financialmodelingprep.com/stable/quote?symbol=%5EGSPC&apikey=${API_KEY}"

# 批量指数（逗号分隔）
curl -s "https://financialmodelingprep.com/stable/quote?symbol=%5EGSPC,%5EDJI,%5EIXIC,%5ERUT&apikey=${API_KEY}"
```

**历史日K线**
```bash
# 指定日期范围（注意 ^ 需要 URL 编码为 %5E）
curl -s "https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=%5EGSPC&from=2026-01-21&to=2026-01-21&apikey=${API_KEY}"
```

### 4. 输出格式

**报价输出示例**:
```
SPX 标普500指数
点位: 6,049.24  涨跌: +52.58 (+0.88%)
今开: 5,996.66  最高: 6,052.04  最低: 5,993.80
更新时间: 2026-01-21 16:00:00 EST
```

**历史K线输出示例（JSON格式，用于日报）**:
```json
{
  "date": "2026-01-21",
  "indices": [
    { "symbol": "SPX", "ticker_used": "^GSPC", "close": 6049.24 },
    { "symbol": "NDX", "ticker_used": "^NDX", "close": 21567.89 }
  ],
  "source": "fmp-api"
}
```

## API参考

### 核心端点（推荐使用 stable 版本）

| 功能 | 端点 | 说明 |
|------|------|------|
| 指数报价 | `/stable/quote?symbol={ticker}` | 最新报价，支持批量（逗号分隔） |
| 历史日K | `/stable/historical-price-eod/full?symbol={ticker}` | 支持 from/to 参数 |

> 注：stable 端点更稳定，旧版 `/api/v3/*` 端点仍可用但不推荐。

### 免费计划限制

- **每日请求**: 250次
- **数据类型**: 日线历史数据（End of Day）
- **延迟**: 15分钟延迟

## 注意事项

1. **API Key安全**: 从环境变量读取，不要硬编码
2. **Ticker格式**: 指数需要加 `^` 前缀（如 `^GSPC`）
3. **请求限制**: 免费计划 250次/天
4. **URL编码**: `^` 符号在URL中需要编码为 `%5E`
