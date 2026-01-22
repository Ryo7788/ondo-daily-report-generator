---
name: market-status
description: 查询美股市场开休市状态。判断今日是否交易日、下一个交易日、美股休市日历。
argument-hint: "[date]"
---

# Market Status - 美股市场状态

查询美股市场开休市状态，包括节假日信息。

## 使用方式

```bash
/market-status                   # 查询今日市场状态
/market-status today             # 同上
/market-status 2026-01-20        # 查询指定日期
/market-status week              # 本周交易日历
/market-status holidays          # 查看全年休市日历
/market-status next              # 下一个交易日
```

## 2026 年美股休市日历

| 日期 | 节日 | 休市类型 |
|------|------|----------|
| 2026-01-01 (四) | 元旦 New Year's Day | 全天休市 |
| 2026-01-19 (一) | 马丁·路德·金纪念日 MLK Day | 全天休市 |
| 2026-02-16 (一) | 总统日 Presidents' Day | 全天休市 |
| 2026-04-03 (五) | 耶稣受难日 Good Friday | 全天休市 |
| 2026-05-25 (一) | 阵亡将士纪念日 Memorial Day | 全天休市 |
| 2026-06-19 (五) | 六月节 Juneteenth | 全天休市 |
| 2026-07-03 (五) | 独立日前夕 Independence Day (Observed) | 全天休市 |
| 2026-09-07 (一) | 劳工节 Labor Day | 全天休市 |
| 2026-11-26 (四) | 感恩节 Thanksgiving Day | 全天休市 |
| 2026-11-27 (五) | 感恩节后 Day after Thanksgiving | 提前收盘 13:00 |
| 2026-12-24 (四) | 平安夜 Christmas Eve | 提前收盘 13:00 |
| 2026-12-25 (五) | 圣诞节 Christmas Day | 全天休市 |

## 实现步骤

### 1. 内置休市日历

将上述休市日期内置为常量数据：

```python
HOLIDAYS_2026 = {
    "2026-01-01": {"name": "New Year's Day", "name_cn": "元旦", "type": "closed"},
    "2026-01-19": {"name": "MLK Day", "name_cn": "马丁·路德·金纪念日", "type": "closed"},
    "2026-02-16": {"name": "Presidents' Day", "name_cn": "总统日", "type": "closed"},
    "2026-04-03": {"name": "Good Friday", "name_cn": "耶稣受难日", "type": "closed"},
    "2026-05-25": {"name": "Memorial Day", "name_cn": "阵亡将士纪念日", "type": "closed"},
    "2026-06-19": {"name": "Juneteenth", "name_cn": "六月节", "type": "closed"},
    "2026-07-03": {"name": "Independence Day (Observed)", "name_cn": "独立日", "type": "closed"},
    "2026-09-07": {"name": "Labor Day", "name_cn": "劳工节", "type": "closed"},
    "2026-11-26": {"name": "Thanksgiving Day", "name_cn": "感恩节", "type": "closed"},
    "2026-11-27": {"name": "Day after Thanksgiving", "name_cn": "感恩节后", "type": "early_close", "close_time": "13:00"},
    "2026-12-24": {"name": "Christmas Eve", "name_cn": "平安夜", "type": "early_close", "close_time": "13:00"},
    "2026-12-25": {"name": "Christmas Day", "name_cn": "圣诞节", "type": "closed"},
}
```

### 2. 判断逻辑

```python
def get_market_status(date):
    # 1. 检查是否周末
    if date.weekday() >= 5:
        return "closed", "Weekend"
    
    # 2. 检查是否节假日
    date_str = date.strftime("%Y-%m-%d")
    if date_str in HOLIDAYS_2026:
        return HOLIDAYS_2026[date_str]
    
    # 3. 正常交易日
    return "open", None
```

### 3. 可选：实时 API 验证

如需实时验证，可调用 Polygon API：
```bash
curl -s "https://api.polygon.io/v1/marketstatus/now?apiKey=${MASSIVE_API_KEY}"
```

返回：
```json
{
  "market": "open",
  "serverTime": "2026-01-22T10:30:00-05:00",
  "exchanges": {
    "nyse": "open",
    "nasdaq": "open"
  },
  "currencies": { "fx": "open", "crypto": "open" }
}
```

### 4. 输出格式

**今日状态**:
```
📊 美股市场状态

日期: 2026-01-22 (周三)
状态: 🟢 正常交易

交易时间 (美东):
- 盘前: 04:00 - 09:30
- 常规: 09:30 - 16:00
- 盘后: 16:00 - 20:00

对应北京时间:
- 盘前: 17:00 - 22:30
- 常规: 22:30 - 05:00 (次日)
- 盘后: 05:00 - 09:00 (次日)
```

**休市日状态**:
```
📊 美股市场状态

日期: 2026-01-19 (周一)
状态: 🔴 休市

休市原因: 马丁·路德·金纪念日 (MLK Day)

下一个交易日: 2026-01-20 (周二)
北京时间恢复交易: 1/20 (二) 晚 22:30
```

**本周日历**:
```
📅 本周交易日历 (2026-01-19 ~ 2026-01-25)

| 日期 | 星期 | 状态 | 备注 |
|------|------|------|------|
| 01/19 | 一 | 🔴 休市 | MLK Day |
| 01/20 | 二 | 🟢 交易 | |
| 01/21 | 三 | 🟢 交易 | |
| 01/22 | 四 | 🟢 交易 | |
| 01/23 | 五 | 🟢 交易 | |
| 01/24 | 六 | ⚫ 周末 | |
| 01/25 | 日 | ⚫ 周末 | |
```

## 日报模板集成

此 skill 覆盖日报以下章节：
- §1.1 今日市场状态

## 时区转换参考

| 美东时间 | 北京时间 | 说明 |
|----------|----------|------|
| 09:30 | 22:30 / 21:30* | 常规交易开始 |
| 16:00 | 05:00 / 04:00* | 常规交易结束 |
| 13:00 | 02:00 / 01:00* | 提前收盘时间 |

*夏令时(3月-11月) / 冬令时(11月-3月)

## 注意事项

1. **数据来源**: 休市日历基于 NYSE 官方公告
2. **夏令时**: 美国夏令时期间，北京时间相差 12 小时；冬令时相差 13 小时
3. **临时休市**: 特殊情况（如国葬、极端天气）可能临时休市，需关注官方公告
4. **提前收盘**: 部分节日前夕 13:00 ET 收盘
