#!/usr/bin/env python3
"""
Stop hook: 每次 Claude 停止回應後自動更新 CLAUDE.md 的「最近進度」區塊。
更新內容：日期 + 最近 5 條 git commits（自動區，不動手寫區）。
"""
import subprocess, datetime, os, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAUDE_MD = os.path.join(REPO, 'CLAUDE.md')

def git_log():
    try:
        out = subprocess.check_output(
            ['git', '-C', REPO, 'log', '--oneline', '-5'],
            stderr=subprocess.DEVNULL
        ).decode('utf-8', errors='replace').strip()
        return out
    except Exception:
        return '（無法取得 git log）'

def update():
    today = datetime.date.today().isoformat()
    log = git_log()
    auto_block = (
        f'最後更新：{today}\n\n'
        f'最近 commits：\n'
        + '\n'.join(f'  {l}' for l in log.splitlines())
    )

    with open(CLAUDE_MD, 'r', encoding='utf-8') as f:
        content = f.read()

    START = '<!-- AUTO:START -->'
    END   = '<!-- AUTO:END -->'
    if START in content and END in content:
        new_content = re.sub(
            re.escape(START) + r'.*?' + re.escape(END),
            START + '\n' + auto_block + '\n' + END,
            content, flags=re.DOTALL
        )
    else:
        # 若沒有標記就在檔尾追加整個區塊
        new_content = content.rstrip() + (
            '\n\n## 📋 最近進度\n'
            + START + '\n' + auto_block + '\n' + END + '\n'
        )

    if new_content != content:
        with open(CLAUDE_MD, 'w', encoding='utf-8') as f:
            f.write(new_content)
        try:
            branch = subprocess.check_output(
                ['git', '-C', REPO, 'rev-parse', '--abbrev-ref', 'HEAD'],
                stderr=subprocess.DEVNULL
            ).decode().strip()
            subprocess.run(['git', '-C', REPO, 'add', 'CLAUDE.md'], check=True, stderr=subprocess.DEVNULL)
            subprocess.run(
                ['git', '-C', REPO, 'commit', '-m', '自動更新 CLAUDE.md 最近進度（Stop hook）'],
                check=True, stderr=subprocess.DEVNULL
            )
            subprocess.run(
                ['git', '-C', REPO, 'push', '-u', 'origin', branch],
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass

if __name__ == '__main__':
    update()
