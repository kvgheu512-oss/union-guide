#!/usr/bin/env bash
# 一鍵跑自動化測試：開本機伺服器 → 跑 e2e → 自動收尾。
# 用法：bash tests/run.sh
# 可覆寫：PORT（預設 8099）、NODE、NODE_PATH、CHROME、PW_CORE
set -e
cd "$(dirname "$0")/.."

PORT="${PORT:-8099}"
NODE="${NODE:-/opt/node22/bin/node}"
export NODE_PATH="${NODE_PATH:-/opt/node22/lib/node_modules}"

# 開伺服器（若該埠已有伺服器在跑，沿用既有的）
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
cleanup(){ kill "$SRV" 2>/dev/null || true; }
trap cleanup EXIT
sleep 1

BASE="http://localhost:$PORT/" "$NODE" tests/e2e.cjs
