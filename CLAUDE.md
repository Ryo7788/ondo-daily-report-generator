# Ondo 美股日报生成器

> 本目录用于生成 Ondo Global Markets 每日美股日报

## 快速开始

在此目录下对 AI 说：

```
用模板帮我生成今天的 Ondo 日报
```

## 核心文件

| 文件 | 用途 |
|------|------|
| `ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt` | 日报生成主提示词（定义流程和规则）|
| `ONDO_DAILY_REPORT_TEMPLATE_V2.md` | 日报 Markdown 模板 |

## 依赖 Skills

| Skill | 用途 | 示例 |
|-------|------|------|
| `/massive` | 个股/ETF 实时行情 | `/massive TSLA,AAPL` |
| `/fmp` | 指数行情（SPX/DJI/IXIC/RUT/VIX）| `/fmp SPX,DJI,IXIC,RUT` |
| `/ondo-tokens` | Ondo 支持的币股列表 | `/ondo-tokens check AAPL` |
| `/earnings` | 财报日历 | `/earnings week` |
| `/commodity` | 大宗商品（黄金/白银）| `/commodity GOLD,SILVER` |
| `/market-status` | 美股开休市状态 | `/market-status` |

## 环境变量配置

在 `.claude/settings.local.json` 中配置 API Keys：

```json
{
  "env": {
    "MASSIVE_API_KEY": "your_polygon_api_key",
    "FMP_API_KEY": "your_fmp_api_key"
  }
}
```

### API Key 获取

| API | 免费计划 | 获取地址 |
|-----|----------|----------|
| Polygon (Massive) | 5次/分钟，15分钟延迟 | https://polygon.io |
| FMP | 250次/天 | https://financialmodelingprep.com |

## 日报生成流程

```
1. 确认日期 → 2. 数据采集 → 3. 生成初稿 → 4. 外部提示词 → 5. 完善日报 → 6. 最终验证
```

详细流程见 `ONDO_DAILY_REPORT_TEMPLATE_PROMPT.txt`

## 输出示例

生成的日报保存为：`ondo_daily_report_YYYY-MM-DD.md`

## 注意事项

1. **Ondo 标的验证**：所有提及的个股必须通过 `/ondo-tokens check` 验证
2. **数据来源标注**：新闻和数据需标注来源（Reuters/CNBC/Bloomberg 等）
3. **时区说明**：关键时间需同时标注美东和北京时间
