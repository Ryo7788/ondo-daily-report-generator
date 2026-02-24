---
name: earnings
description: FMP API 查询美股财报日历。本周财报、指定日期、单股下次财报。
argument-hint: "[week|today|date|ticker]"
---

# 美股财报日历

$ARGUMENTS

## API

- 日期范围: `/stable/earnings-calendar?from={date}&to={date}&apikey=${FMP_API_KEY}`
- 单股历史: `/stable/historical/earnings-calendar/{ticker}?apikey=${FMP_API_KEY}`

## 返回字段

关键字段：`date`(发布日), `symbol`, `eps`/`epsEstimated`, `revenue`/`revenueEstimated`, `time`(`bmo`=盘前, `amc`=盘后)

## 限制

- 免费 250 次/天
- 财报结果发布后数小时更新
- 查询结果应与 `/ondo-tokens check` 联动验证
