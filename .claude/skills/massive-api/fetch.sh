#!/bin/bash
# Massive API 数据获取脚本
# 用法: ./fetch.sh <ticker> [command] [options]

set -e

# 配置
API_BASE="https://api.polygon.io"
API_KEY="${MASSIVE_API_KEY}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查API Key
if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: MASSIVE_API_KEY 未配置${NC}"
    echo "请在 .claude/settings.local.json 中设置:"
    echo '  "env": { "MASSIVE_API_KEY": "your_api_key" }'
    exit 1
fi

# 检查依赖
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq未安装，输出为原始JSON${NC}"
    USE_JQ=false
else
    USE_JQ=true
fi

# 解析参数
TICKER="${1:-}"
COMMAND="${2:-snapshot}"
OPTION="${3:-}"

# 显示帮助
show_help() {
    echo "用法: $0 <ticker> [command] [options]"
    echo ""
    echo "命令:"
    echo "  snapshot (默认)  获取股票快照"
    echo "  bars <from>      获取历史K线 (from: YYYY-MM-DD)"
    echo "  quote            获取最新报价"
    echo "  trade            获取最新成交"
    echo ""
    echo "示例:"
    echo "  $0 AAPL                    # AAPL快照"
    echo "  $0 AAPL bars 2026-01-01    # AAPL日K线"
    echo "  $0 AAPL quote              # AAPL报价"
    echo "  $0 SPY,QQQ,AAPL            # 批量快照"
}

# 检查ticker
if [ -z "$TICKER" ]; then
    show_help
    exit 1
fi

# 格式化数字
format_number() {
    if $USE_JQ; then
        printf "%'.2f" "$1" 2>/dev/null || echo "$1"
    else
        echo "$1"
    fi
}

# 格式化大数字 (成交量)
format_volume() {
    local vol=$1
    if [ "$vol" -ge 1000000000 ]; then
        echo "$(echo "scale=1; $vol/1000000000" | bc)B"
    elif [ "$vol" -ge 1000000 ]; then
        echo "$(echo "scale=1; $vol/1000000" | bc)M"
    elif [ "$vol" -ge 1000 ]; then
        echo "$(echo "scale=1; $vol/1000" | bc)K"
    else
        echo "$vol"
    fi
}

# 获取快照
get_snapshot() {
    local ticker=$1
    local url="${API_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${API_KEY}"

    local response=$(curl -s "$url")

    if $USE_JQ; then
        local status=$(echo "$response" | jq -r '.status // "ERROR"')
        if [ "$status" != "OK" ]; then
            echo -e "${RED}Error: $(echo "$response" | jq -r '.error // .message // "Unknown error"')${NC}"
            return 1
        fi

        echo "$response" | jq -r '
            .ticker |
            "\(.ticker)\n" +
            "价格: $\(.lastTrade.p // .day.c // "N/A")  " +
            "涨跌: \(if .todaysChange >= 0 then "+" else "" end)\(.todaysChange // 0 | tostring | .[0:6]) " +
            "(\(if .todaysChangePerc >= 0 then "+" else "" end)\(.todaysChangePerc // 0 | tostring | .[0:5])%)\n" +
            "今开: $\(.day.o // "N/A")  最高: $\(.day.h // "N/A")  最低: $\(.day.l // "N/A")\n" +
            "成交量: \(.day.v // "N/A")"
        '
    else
        echo "$response"
    fi
}

# 获取K线
get_bars() {
    local ticker=$1
    local from=$2
    local to=$(date +%Y-%m-%d)

    if [ -z "$from" ]; then
        from=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)
    fi

    local url="${API_BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=desc&limit=30&apiKey=${API_KEY}"

    local response=$(curl -s "$url")

    if $USE_JQ; then
        local status=$(echo "$response" | jq -r '.status // "ERROR"')
        if [ "$status" != "OK" ]; then
            echo -e "${RED}Error: $(echo "$response" | jq -r '.error // .message // "Unknown error"')${NC}"
            return 1
        fi

        echo -e "${GREEN}${ticker} 日K线 (${from} 至 ${to})${NC}"
        echo "日期        开盘     最高     最低     收盘     成交量"
        echo "------------------------------------------------------"

        echo "$response" | jq -r '
            .results[] |
            "\(.t / 1000 | strftime("%Y-%m-%d"))  \(.o | tostring | .[0:8] | . + " " * (8 - length))  \(.h | tostring | .[0:8] | . + " " * (8 - length))  \(.l | tostring | .[0:8] | . + " " * (8 - length))  \(.c | tostring | .[0:8] | . + " " * (8 - length))  \(.v)"
        '
    else
        echo "$response"
    fi
}

# 获取报价
get_quote() {
    local ticker=$1
    local url="${API_BASE}/v2/last/quote/${ticker}?apiKey=${API_KEY}"

    local response=$(curl -s "$url")

    if $USE_JQ; then
        echo "$response" | jq -r '
            .results // . |
            "\(.T // .ticker // "N/A")\n" +
            "买价: $\(.p // .bid // "N/A") x \(.s // .bidsize // .bid_size // "N/A")\n" +
            "卖价: $\(.P // .ask // "N/A") x \(.S // .asksize // .ask_size // "N/A")"
        '
    else
        echo "$response"
    fi
}

# 获取成交
get_trade() {
    local ticker=$1
    local url="${API_BASE}/v2/last/trade/${ticker}?apiKey=${API_KEY}"

    local response=$(curl -s "$url")

    if $USE_JQ; then
        echo "$response" | jq -r '
            .results // . |
            "\(.T // .ticker // "N/A")\n" +
            "成交价: $\(.p // .price // "N/A")\n" +
            "成交量: \(.s // .size // "N/A")"
        '
    else
        echo "$response"
    fi
}

# 主逻辑
case "$COMMAND" in
    snapshot|snap|s)
        # 支持批量查询
        IFS=',' read -ra TICKERS <<< "$TICKER"
        for t in "${TICKERS[@]}"; do
            get_snapshot "$t"
            echo ""
        done
        ;;
    bars|bar|b|kline|k)
        get_bars "$TICKER" "$OPTION"
        ;;
    quote|q)
        get_quote "$TICKER"
        ;;
    trade|t)
        get_trade "$TICKER"
        ;;
    help|h|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac
