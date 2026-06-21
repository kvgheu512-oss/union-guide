#!/usr/bin/env bash
# 版本升版：一個指令同步「單一真相源」。用法：
#   ./bump.sh                 # 自動 = 今天日期 + 兩碼流水（同日自動 +1）
#   ./bump.sh 2026062170      # 指定 10 碼版號
set -e
cd "$(dirname "$0")"

if [ -n "$1" ]; then
  V="$1"
else
  TODAY="$(date +%Y%m%d)"
  CUR="$(cat ver.txt 2>/dev/null | tr -d '[:space:]')"
  if [ "${CUR:0:8}" = "$TODAY" ]; then
    SEQ=$(( 10#${CUR:8:2} + 1 ))
  else
    SEQ=1
  fi
  V="$TODAY$(printf '%02d' "$SEQ")"
fi

if ! printf '%s' "$V" | grep -Eq '^[0-9]{10}$'; then
  echo "✗ 版號需為 10 碼數字（YYYYMMDD + 兩碼），got: $V" >&2; exit 1
fi

printf '%s' "$V" > ver.txt
printf 'self.__BUILD = "%s";\n' "$V" > /tmp/.vbuild
# 只換 version.js 裡的賦值行，保留註解
python3 - "$V" <<'PY'
import sys,re
v=sys.argv[1]; p="version.js"; s=open(p).read()
s=re.sub(r'self\.__BUILD\s*=\s*"\d{10}";', 'self.__BUILD = "%s";'%v, s)
open(p,'w').write(s)
PY
echo "✅ 已升版到 $V（ver.txt + version.js；sw.js 由 importScripts 自動套用，各頁讀 self.__BUILD）"
