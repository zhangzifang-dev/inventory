#!/bin/bash
cd "$(dirname "$0")"
mkdir -p logs
nohup npm run start:dev > logs/server.log 2>&1 &
echo "Server started, logs: logs/server.log"
echo "PID: $!"
