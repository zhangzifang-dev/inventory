#!/bin/bash
cd "$(dirname "$0")"
mkdir -p logs
nohup npm run dev > logs/web.log 2>&1 &
echo "Web started, logs: logs/web.log"
echo "PID: $!"
