---
name: commodity
description: 获取大宗商品实时行情（黄金、白银、原油等）。当需要查询贵金属价格、避险资产行情时使用此skill。
argument-hint: "[symbol]"
---

# Commodity - 大宗商品行情

从 FMP API 获取大宗商品实时报价。

## 使用方式

```bash
/commodity                       # 获取黄金、白银报价（默认）
/commodity GOLD                  # 获取黄金报价
/commodity SILVER                # 获取白银报价
/commodity GOLD,SILVER,OIL       # 批量获取多个商品
/commodity list                  # 列出所有支持的商品代码
```

## 支持的商品代码

### 贵金属（日报常用）
| 简称 | FMP Symbol | 名称 |
|------|------------|------|
| GOLD | GCUSD | 黄金现货 |
| SILVER | SIUSD | 白银现货 |
| PLATINUM | PLUSD | 铂金 |
| PALLADIUM | PAUSD | 钯金 |

### 能源
| 简称 | FMP Symbol | 名称 |
|------|------------|------|
| OIL / WTI | CLUSD | WTI 原油 |
| BRENT | BZUSD | 布伦特原油 |
| NATGAS | NGUSD | 天然气 |

### 农产品
| 简称 | FMP Symbol | 名称 |
|------|------------|------|
| CORN | ZCUSD | 玉米 |
| WHEAT | KEUSD | 小麦 |
| SOYBEAN | ZSUSD | 大豆 |
| COFFEE | KCUSD | 咖啡 |

## 实现步骤

### 1. 环境变量检查

```bash
API_KEY="${FMP_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: FMP_API_KEY 未配置"
    exit 1
fi
```

### 2. Symbol 映射

将简称转换为 FMP symbol：
```
GOLD → GCUSD
SILVER → SIUSD
OIL / WTI → CLUSD
BRENT → BZUSD
```

### 3. API 调用

**单个商品报价**
```bash
curl -s "https://financialmodelingprep.com/api/v3/quote/GCUSD?apikey=${API_KEY}"
```

**批量商品报价**
```bash
curl -s "https://financialmodelingprep.com/api/v3/quote/GCUSD,SIUSD,CLUSD?apikey=${API_KEY}"
```

**商品列表**
```bash
curl -s "https://financialmodelingprep.com/api/v3/symbol/available-commodities?apikey=${API_KEY}"
```

### 4. 返回数据结构

```json
[
  {
    "symbol": "GCUSD",
    "name": "Gold",
    "price": 2756.80,
    "changesPercentage": 0.45,
    "change": 12.30,
    "dayLow": 2742.10,
    "dayHigh": 2761.50,
    "yearHigh": 2790.00,
    "yearLow": 1984.50,
    "previousClose": 2744.50,
    "open": 2745.20,
    "volume": 182456,
    "timestamp": 1737561600
  }
]
```

### 5. 输出格式

**默认输出（黄金+白银）**:
```
🥇 贵金属行情

黄金 (GOLD/GCUSD)
价格: $2,756.80/盎司  涨跌: +$12.30 (+0.45%)
今开: $2,745.20  最高: $2,761.50  最低: $2,742.10
52周高: $2,790.00  52周低: $1,984.50

白银 (SILVER/SIUSD)
价格: $30.85/盎司  涨跌: +$0.42 (+1.38%)
今开: $30.50  最高: $31.10  最低: $30.35
52周高: $32.50  52周低: $22.10

更新时间: 2026-01-22 10:30:00 EST
```

**批量输出**:
```
大宗商品行情

| 商品 | 价格 | 涨跌 | 涨跌幅 |
|------|------|------|--------|
| 黄金 | $2,756.80 | +$12.30 | +0.45% |
| 白银 | $30.85 | +$0.42 | +1.38% |
| WTI原油 | $75.20 | -$0.85 | -1.12% |
```

## 日报模板集成

此 skill 覆盖日报以下章节：
- §1.3 宏观环境 → 避险资产（黄金/白银）
- §宣发点3（黄金/大类资产主题）

## 历史数据

如需历史 K 线数据：
```bash
# 黄金日 K 线
curl -s "https://financialmodelingprep.com/api/v3/historical-price-full/GCUSD?apikey=${API_KEY}"
```

## 注意事项

1. **免费计划限制**: 250 次/天
2. **数据延迟**: 约 15 分钟延迟
3. **单位说明**: 
   - 黄金/白银/铂金/钯金：美元/盎司
   - 原油：美元/桶
   - 天然气：美元/MMBtu
4. **交易时间**: 商品期货交易时间与美股不同，几乎 24 小时交易
