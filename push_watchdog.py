#!/usr/bin/env python3
# ═══ PMApp 留言→Apple Watch 推送守护进程 ═══
# 常驻轮询 Supabase sync_data 中的新留言（message_board），
# 发现新留言即向所有已订阅设备发送 Web Push（iPhone 锁屏时镜像到 Apple Watch）。
#
# 零成本方案：无需云服务器，跑在用户 Mac 上（launchd 常驻）。
# 升级方案：见 supabase/functions/push-notify/index.ts（Supabase Edge Function，关 Mac 也能推）。
#
# 依赖：pywebpush（已装在 /Users/chenbangjie/.workbuddy/binaries/python/envs/default）
# 密钥：同目录 vapid_keys.json
#
# 用法：
#   python3 push_watchdog.py --once    # 手动跑一轮（基线/测试）
#   python3 push_watchdog.py           # 常驻循环（launchd 调用）
#   python3 push_watchdog.py --since 5 # 只推最近 5 分钟内留言（调试用）

import sys, os, json, time, argparse, urllib.request, urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

SUPABASE_URL = 'https://nsnmtkukxquhinlmbejg.supabase.co'
SUPABASE_KEY = 'sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW'
SYNC_TABLE = 'sync_data'
SUB_TABLE = 'push_subscriptions'
STATE_FILE = os.path.join(BASE_DIR, '.push_watchdog_state.json')
LOG_FILE = os.path.join(BASE_DIR, 'push_watchdog.log')
LOCK_FILE = os.path.join(BASE_DIR, '.push_watchdog.lock')
POLL_SECONDS = 15
MAX_SEEN = 300


def log(msg):
    line = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {msg}'
    print(line)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
    except Exception:
        pass


def rest_get(table, query):
    url = f'{SUPABASE_URL}/rest/v1/{table}?{query}'
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {'seen': [], 'last_run': None}


def save_state(st):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(st, f, ensure_ascii=False)


def acquire_lock():
    try:
        fd = os.open(LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return True
    except FileExistsError:
        return False


def release_lock():
    try:
        os.unlink(LOCK_FILE)
    except OSError:
        pass


def fetch_subscriptions():
    subs = rest_get(SUB_TABLE, 'select=endpoint,p256dh,auth')
    return subs or []


def fetch_new_messages(seen):
    """取最近 50 条未删除留言，按 supabase_id 去重，返回未见过的新留言。"""
    rows = rest_get(
        SYNC_TABLE,
        'table_name=eq.message_board&is_deleted=eq.false'
        '&select=supabase_id,payload,updated_at&order=updated_at.desc&limit=50'
    )
    fresh = []
    for r in rows:
        sid = r.get('supabase_id')
        if sid in seen:
            continue
        try:
            p = r.get('payload')
            p = json.loads(p) if isinstance(p, str) else (p or {})
        except Exception:
            p = {}
        name = str(p.get('name', '')).strip()
        content = str(p.get('content', '')).strip()
        if not name and not content:
            continue  # 空/损坏 payload 跳过
        fresh.append({'sid': sid, 'name': name, 'content': content})
    return fresh


def send_push(title, body, subs, vapid_private):
    from pywebpush import webpush
    payload = json.dumps({
        'title': title,
        'body': body,
        'url': 'https://ryanchen7051.github.io/pmapp-mobile/',
        'tag': 'pmapp-message',
    }).encode('utf-8')
    ok = 0
    for s in subs:
        sub = {'endpoint': s['endpoint'], 'keys': {'p256dh': s['p256dh'], 'auth': s['auth']}}
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={'sub': 'mailto:dev@pmapp.io'},
            )
            ok += 1
        except Exception as e:
            log(f'✗ 推送失败 {s["endpoint"][:40]}...: {e}')
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--once', action='store_true', help='只跑一轮')
    ap.add_argument('--daemon', action='store_true', help='daemon 模式（由入口脚本调用，忽略）')
    ap.add_argument('--since', type=int, default=30, help='回看窗口（分钟），默认 30')
    args = ap.parse_args()

    if not acquire_lock():
        log('上一轮仍在运行，跳过本轮。')
        return
    try:
        with open(os.path.join(BASE_DIR, 'vapid_keys.json'), encoding='utf-8') as f:
            vapid_private = json.load(f)['privateKey']

        state = load_state()
        seen = set(state.get('seen', []))

        # 仅首次运行（无基线标记）时：把当前已有留言全部记为已见，避免给历史留言补推
        if not state.get('baseline_done'):
            try:
                baseline = rest_get(
                    SYNC_TABLE,
                    'table_name=eq.message_board&is_deleted=eq.false&select=supabase_id&limit=200'
                )
                for r in baseline:
                    seen.add(r.get('supabase_id'))
                log(f'首轮基线建立完成：已标记 {len(baseline)} 条历史留言。')
            except Exception as e:
                log(f'⚠️ 基线读取失败（忽略，继续）: {e}')
            state['baseline_done'] = True
            save_state({'seen': list(seen)[-MAX_SEEN:], 'baseline_done': True,
                        'last_run': time.strftime('%Y-%m-%d %H:%M:%S')})

        fresh = fetch_new_messages(seen)
        if fresh:
            subs = fetch_subscriptions()
            if not subs:
                log(f'⚠️ 发现 {len(fresh)} 条新留言，但没有已订阅设备（请先在 PWA 设置启用推送）。')
            else:
                for m in fresh:
                    title = f'💬 {m["name"]} 留言'
                    body = m['content'][:80]
                    ok = send_push(title, body, subs, vapid_private)
                    log(f'✓ 新留言推送 {m["name"]}: {m["content"][:40]}... → 成功 {ok}/{len(subs)}')
                    seen.add(m['sid'])
                save_state({'seen': list(seen)[-MAX_SEEN:], 'last_run': time.strftime('%Y-%m-%d %H:%M:%S')})
        # 统一落盘（保留 baseline_done，防止重复建基线）
        save_state({
            'seen': list(seen)[-MAX_SEEN:],
            'baseline_done': state.get('baseline_done', True),
            'last_run': time.strftime('%Y-%m-%d %H:%M:%S'),
        })
    finally:
        release_lock()


if __name__ == '__main__':
    if '--daemon' in sys.argv:
        # 彻底脱离会话（double fork + setsid），避免随调用方会话退出而被清理
        try:
            if os.fork() > 0:
                sys.exit(0)
            os.setsid()
            if os.fork() > 0:
                sys.exit(0)
            sys.stdout = sys.stderr = open(LOG_FILE, 'a', encoding='utf-8')
        except Exception:
            pass
    if '--once' in sys.argv:
        try:
            main()
        finally:
            sys.exit(0)
    log('守护进程启动，每 15 秒轮询一次。')
    while True:
        try:
            main()
        except Exception as e:
            log(f'⚠️ 轮询异常: {e}')
        time.sleep(POLL_SECONDS)
