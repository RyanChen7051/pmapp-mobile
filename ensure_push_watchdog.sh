#!/bin/bash
# ═══ PMApp 留言推送守护进程 · 启动/保活脚本 ═══
# 用途：
#   1. 立即启动常驻轮询（nohup 后台）
#   2. 被 cron 每 5 分钟调用一次时，检查进程是否存活，不在则拉起
# 依赖：push_watchdog.py + managed python（已装 pywebpush）

PY="/Users/chenbangjie/.workbuddy/binaries/python/envs/default/bin/python3"
WATCH="/Users/chenbangjie/WorkBuddy/PMApp/pwa/push_watchdog.py"
PIDFILE="/Users/chenbangjie/WorkBuddy/PMApp/pwa/.push_watchdog.pid"

if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$OLD_PID" ] && [ "$OLD_PID" != "0" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        # 已在运行，无需动作
        exit 0
    fi
    rm -f "$PIDFILE"
fi

# 启动守护进程（daemon 模式：double-fork 脱离会话，防随调用方退出被清理）
cd /Users/chenbangjie/WorkBuddy/PMApp/pwa
"$PY" "$WATCH" --daemon
sleep 1
if [ -f "$PIDFILE" ] && [ -s "$PIDFILE" ]; then :; fi
NEW_PID=$(pgrep -f "push_watchdog.py --daemon" | head -1)
echo "${NEW_PID:-0}" > "$PIDFILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') 已启动推送守护进程 PID=${NEW_PID:-?}" >> /Users/chenbangjie/WorkBuddy/PMApp/pwa/push_watchdog.log
