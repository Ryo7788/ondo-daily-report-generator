---
name: massive
description: 获取美股实时行情数据。支持股票快照、K线数据、最新报价等。当需要查询股票价格、涨跌幅、历史K线时使用此skill。
argument-hint: "<ticker> [command] [options]"
---

> **使用边界**: 本 skill 仅用于 **个股/ETF** 行情查询（如 AAPL、TSLA、SPY）。
> 如需查询 **指数**（SPX、DJI、VIX 等），请使用 `/fmp` skill。

# Massive API 行情数据获取

从Massive API获取美股实时/延迟行情数据。

## 使用方式

```bash
/massive AAPL                    # 获取AAPL快照（价格、涨跌幅）
/massive AAPL bars 2026-01-01    # 获取AAPL从指定日期到今天的日K线
/massive AAPL quote              # 获取AAPL最新报价（买卖价）
/massive SPY,QQQ,AAPL            # 批量获取多只股票快照
```

## 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `snapshot` (默认) | 股票快照：最新价、涨跌幅、成交量 | `/massive AAPL` |
| `bars` | 历史K线数据 | `/massive AAPL bars 2026-01-01` |
| `quote` | 最新买卖报价 | `/massive AAPL quote` |
| `trade` | 最新成交价 | `/massive AAPL trade` |

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

API_KEY="${MASSIVE_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: MASSIVE_API_KEY 未配置"
    echo "请运行 ./init.sh 配置 API Key"
    exit 1
fi
```

### 2. API调用

**股票快照** (默认)
```bash
curl -s "https://api.massive.com/v2/snapshot/locale/us/markets/stocks/tickers/${TICKER}?apiKey=${API_KEY}"
```

**历史K线**
```bash
curl -s "https://api.massive.com/v2/aggs/ticker/${TICKER}/range/1/day/${FROM}/${TO}?adjusted=true&apiKey=${API_KEY}"
```

**最新报价**
```bash
curl -s "https://api.massive.com/v2/last/quote/${TICKER}?apiKey=${API_KEY}"
```

**最新成交**
```bash
curl -s "https://api.massive.com/v2/last/trade/${TICKER}?apiKey=${API_KEY}"
```

### 3. 输出格式

将返回的JSON解析为易读格式：

**快照输出示例**:
```
AAPL 苹果公司
价格: $186.10  涨跌: +$2.35 (+1.28%)
今开: $185.25  最高: $186.50  最低: $184.75
成交量: 52,341,000
更新时间: 2026-01-22 10:30:00 EST
```

**K线输出示例**:
```
AAPL 日K线 (2026-01-01 至 2026-01-22)
日期        开盘     最高     最低     收盘     成交量
2026-01-22  185.25   186.50   184.75   186.10   52.3M
2026-01-21  183.50   185.80   183.00   185.25   48.1M
...
```

## API参考

详细 API 文档见: [Polygon.io Docs](https://polygon.io/docs/stocks)

### 核心端点

| 功能 | 端点 | 计划要求 |
|------|------|----------|
| 股票快照 | `/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` | Starter+ |
| 历史K线 | `/v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}` | Basic+ |
| 最新报价 | `/v2/last/quote/{ticker}` | Developer+ |
| 最新成交 | `/v2/last/trade/{ticker}` | Developer+ |

## 注意事项

1. **API Key安全**: 从环境变量读取，不要硬编码
2. **请求限制**: Basic计划5次/分钟，付费计划无限制
3. **数据延迟**: 免费15分钟延迟，Advanced计划实时
4. **股票代码**: 大小写敏感，使用大写（如AAPL, TSLA）
