---
name: earnings
description: 获取美股财报日历。查询本周/指定日期的财报发布、单只股票的下次财报日期。当需要查询财报时间、EPS预期时使用此skill。
argument-hint: "[command] [date/ticker]"
---

# Earnings - 美股财报日历

从 FMP API 获取美股财报日历数据。

## 使用方式

```bash
/earnings                        # 获取本周财报日历
/earnings week                   # 同上
/earnings today                  # 获取今日财报
/earnings 2026-01-22             # 获取指定日期财报
/earnings 2026-01-20 2026-01-24  # 获取日期范围内的财报
/earnings NFLX                   # 查询 NFLX 下次财报日期
/earnings NFLX,INTC,TSLA         # 批量查询多只股票
```

## 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `week` (默认) | 本周财报日历 | `/earnings` |
| `today` | 今日财报 | `/earnings today` |
| `{date}` | 指定日期财报 | `/earnings 2026-01-22` |
| `{from} {to}` | 日期范围财报 | `/earnings 2026-01-20 2026-01-24` |
| `{ticker}` | 查询单股下次财报 | `/earnings NFLX` |

## 实现步骤

### 1. 环境变量检查

```bash
API_KEY="${FMP_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: FMP_API_KEY 未配置"
    exit 1
fi
```

### 2. API 调用

**财报日历（日期范围）**
```bash
# 获取指定日期范围的财报
curl -s "https://financialmodelingprep.com/api/v3/earning_calendar?from=2026-01-20&to=2026-01-24&apikey=${API_KEY}"
```

**单股财报查询**
```bash
# 获取特定股票的历史财报记录
curl -s "https://financialmodelingprep.com/api/v3/historical/earning_calendar/NFLX?apikey=${API_KEY}"
```

### 3. 返回数据结构

**财报日历响应**:
```json
[
  {
    "date": "2026-01-21",
    "symbol": "NFLX",
    "eps": null,
    "epsEstimated": 4.21,
    "time": "amc",
    "revenue": null,
    "revenueEstimated": 10230000000,
    "fiscalDateEnding": "2025-12-31",
    "updatedFromDate": "2026-01-15"
  }
]
```

**字段说明**:
| 字段 | 说明 |
|------|------|
| `date` | 财报发布日期 |
| `symbol` | 股票代码 |
| `eps` | 实际 EPS（发布前为 null）|
| `epsEstimated` | 预期 EPS |
| `time` | 发布时间：`bmo`=盘前, `amc`=盘后 |
| `revenue` | 实际营收 |
| `revenueEstimated` | 预期营收 |

### 4. 输出格式

**本周财报日历**:
```
📅 本周财报日历 (2026-01-20 ~ 2026-01-24)

| 日期 | 股票 | 时间 | 预期EPS | 预期营收 |
|------|------|------|---------|----------|
| 01/21 | NFLX | 盘后 | $4.21 | $10.2B |
| 01/22 | INTC | 盘后 | $0.12 | $14.3B |
| 01/23 | TSLA | 盘后 | $0.76 | $25.8B |

共 15 家公司发布财报
```

**单股财报查询**:
```
NFLX (Netflix) 财报信息

下次财报: 2026-01-21 (盘后)
预期 EPS: $4.21
预期营收: $10.2B
财年截止: 2025-12-31

历史财报:
| 日期 | 实际EPS | 预期EPS | 惊喜 |
|------|---------|---------|------|
| 2025-10-17 | $5.40 | $5.12 | +5.5% |
| 2025-07-18 | $4.88 | $4.74 | +3.0% |
```

## 时间转换

| FMP `time` 值 | 含义 | 美东时间 | 北京时间 |
|---------------|------|----------|----------|
| `bmo` | Before Market Open | ~07:00 | ~20:00 (前一日) |
| `amc` | After Market Close | ~16:30 | ~05:30 (次日) |

## 日报模板集成

此 skill 覆盖日报以下章节：
- §5.1 本周重点财报
- §5.2 本周最受关注财报
- §4.3 本周重点关注（财报事件）

## 注意事项

1. **免费计划限制**: 250 次/天
2. **数据延迟**: 财报结果通常在发布后数小时更新
3. **预期数据**: EPS/营收预期来自分析师共识
4. **Ondo 验证**: 查询结果应与 `/ondo-tokens check` 联动验证
