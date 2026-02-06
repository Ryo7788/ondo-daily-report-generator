# API Keys 配置指南

本项目依赖两个金融数据 API 服务，在生成日报前必须确保 API Key 有效。

---

## 1. FMP API (Financial Modeling Prep)

### 用途
| Skill | 数据类型 |
|-------|----------|
| `/fmp` | 美股指数行情（SPX、DJI、IXIC、RUT、VIX）|
| `/commodity` | 大宗商品（黄金、白银、原油）|
| `/earnings` | 财报日历 |

### 配置
```bash
# .env 文件
FMP_API_KEY=your_fmp_api_key_here
```

### 获取方式
1. 访问 https://financialmodelingprep.com/developer/docs
2. 注册账号（可用 Google 登录）
3. 在 Dashboard 获取 API Key

### 免费计划限制
| 限制项 | 说明 |
|--------|------|
| 每日请求 | 250 次/天 |
| 数据延迟 | 15 分钟 |
| 历史数据 | 仅日线（End of Day）|
| 端点限制 | 部分高级端点需付费 |

### 常见错误
| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `Premium Query Parameter` | 批量查询或高级端点需付费 | **单独查询每个symbol**（见下方说明）|
| `Legacy Endpoint` | 旧版 API 已停用 | 使用 `/stable/` 端点 |
| `Invalid API Key` | API Key 无效或过期 | 重新获取 API Key |
| `Rate limit exceeded` | 超过每日限额 | 等待次日或升级计划 |

> ⚠️ **批量查询限制**：免费计划下，批量查询（多个symbol逗号分隔）会返回 "Premium Query Parameter"。
> **解决方案**：分别对每个指数单独发起请求，不要批量！
> ```bash
> # ❌ 批量 - 需付费
> curl "...?symbol=%5EGSPC,%5EDJI&apikey=..."
>
> # ✅ 单独 - 免费可用
> curl "...?symbol=%5EGSPC&apikey=..."
> curl "...?symbol=%5EDJI&apikey=..."
> ```

### API 端点参考
```bash
# 指数报价（推荐使用 stable 端点）
curl "https://financialmodelingprep.com/stable/quote?symbol=%5EGSPC&apikey=${FMP_API_KEY}"

# 大宗商品报价
curl "https://financialmodelingprep.com/stable/quote?symbol=GCUSD&apikey=${FMP_API_KEY}"

# 财报日历
curl "https://financialmodelingprep.com/stable/earnings-calendar?from=2026-01-20&to=2026-01-24&apikey=${FMP_API_KEY}"
```

### 价格方案
| 计划 | 价格 | 请求限制 | 特点 |
|------|------|----------|------|
| Free | $0 | 250/天 | 基础数据，15分钟延迟 |
| Starter | $14/月 | 10,000/天 | 更多端点 |
| Professional | $49/月 | 100,000/天 | 实时数据 |

---

## 2. Polygon API (Massive)

### 用途
| Skill | 数据类型 |
|-------|----------|
| `/massive` | 个股/ETF 实时行情（AAPL、TSLA、SPY 等）|

### 配置
```bash
# .env 文件
MASSIVE_API_KEY=your_polygon_api_key_here
```

### 获取方式
1. 访问 https://polygon.io
2. 注册账号
3. 在 Dashboard > API Keys 获取

### 免费计划限制
| 限制项 | 说明 |
|--------|------|
| 请求频率 | 5 次/分钟 |
| 数据延迟 | 15 分钟 |
| 历史数据 | 2 年 |

### 常见错误
| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `Not authorized` | API Key 无效 | 检查 API Key 是否正确 |
| `Rate limit exceeded` | 超过请求频率 | 等待 1 分钟后重试 |
| `No data found` | 股票代码不存在 | 检查 ticker 拼写 |

### API 端点参考
```bash
# 个股快照
curl "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/AAPL?apiKey=${MASSIVE_API_KEY}"

# 历史 K 线
curl "https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2026-01-01/2026-01-28?apiKey=${MASSIVE_API_KEY}"

# 最新报价
curl "https://api.polygon.io/v2/last/trade/AAPL?apiKey=${MASSIVE_API_KEY}"
```

### 价格方案
| 计划 | 价格 | 请求限制 | 特点 |
|------|------|----------|------|
| Basic | $0 | 5/分钟 | 15分钟延迟 |
| Starter | $29/月 | 无限 | 实时数据 |
| Developer | $79/月 | 无限 | WebSocket |

---

## 3. 快速验证 API Key

在开始日报生成前，运行以下命令验证 API Key 是否有效：

```bash
# 加载环境变量
source .env

# 验证 FMP API Key
echo "=== FMP API 验证 ==="
curl -s "https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=${FMP_API_KEY}" | head -c 200

# 验证 Polygon API Key
echo -e "\n\n=== Polygon API 验证 ==="
curl -s "https://api.polygon.io/v2/last/trade/AAPL?apiKey=${MASSIVE_API_KEY}" | head -c 200
```

### 预期输出
- **FMP**：返回 JSON 数组包含 AAPL 报价数据
- **Polygon**：返回 JSON 对象包含 `results` 字段

### 错误输出
- 包含 `error`、`Invalid`、`unauthorized` 等关键词表示 API Key 无效

---

## 4. API 不可用时的处理规则

> ⛔ **严禁降级**：不得使用 WebSearch 或其他方式替代 API

当 API 返回错误时，**必须立即暂停并询问用户**：

| 错误类型 | 必须询问用户 |
|----------|-------------|
| FMP API 无效/过期 | "FMP API Key 无效，请更新 .env 中的 FMP_API_KEY" |
| FMP API 需付费 | "FMP API 返回需要付费订阅，请升级计划或更换 Key" |
| Polygon API 无效 | "Polygon API Key 无效，请更新 .env 中的 MASSIVE_API_KEY" |
| 请求超限 | "API 请求超过限制，请等待后重试或升级计划" |

**禁止行为**：
- ❌ 自行使用 WebSearch 替代 API
- ❌ 跳过 API 数据采集步骤
- ❌ 使用估算或历史数据替代实时数据

---

## 5. 环境变量模板

`.env` 文件模板：
```bash
# Ondo 美股日报生成器 - API Keys
# 此文件由 init.sh 自动生成，请勿提交到 Git

# FMP API - 指数、商品、财报
# 获取地址: https://financialmodelingprep.com
FMP_API_KEY=your_fmp_api_key_here

# Polygon API - 个股/ETF 行情
# 获取地址: https://polygon.io
MASSIVE_API_KEY=your_polygon_api_key_here
```

---

*最后更新：2026-01-30*
