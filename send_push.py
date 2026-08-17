#!/usr/bin/env python3
# ═══ PMApp Web Push 发送端（Apple Watch 镜像通知 路径 A）═══
# 零成本：读取 Supabase 中已订阅的端点，用 VAPID 私钥逐一推送。
#
# 依赖：pywebpush  pip install pywebpush
# 密钥：vapid_keys.json（由生成脚本产出，含 privateKey，切勿提交/泄露）
#
# 用法：
#   python3 send_push.py "标题" "正文"
#   python3 send_push.py "项目异常" "A 项目 IQC 不良率超阈值" --url "https://ryanchen7051.github.io/pmapp-mobile/?goto=quality"
#   python3 send_push.py "测试" "这是一条测试推送" --test    # 仅发第一条订阅，验证链路
#
# 也可被桌面端 PMApp 调用：在关键事件（新异常/出货/审核）时触发本脚本。

import sys, json, argparse, urllib.request, urllib.error

SUPABASE_URL = 'https://nsnmtkukxquhinlmbejg.supabase.co'
SUPABASE_KEY = 'sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW'
TABLE = 'push_subscriptions'

def load_vapid():
    with open('vapid_keys.json', 'r', encoding='utf-8') as f:
        return json.load(f)['privateKey']

def fetch_subscriptions():
    url = f'{SUPABASE_URL}/rest/v1/{TABLE}?select=endpoint,p256dh,auth&order=created_at.desc'
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('title', nargs='?', default='PMApp')
    ap.add_argument('body', nargs='?', default='您有一条新提醒')
    ap.add_argument('--url', default='https://ryanchen7051.github.io/pmapp-mobile/')
    ap.add_argument('--tag', default='pmapp')
    ap.add_argument('--test', action='store_true', help='只发第一条订阅，用于验证链路')
    args = ap.parse_args()

    from pywebpush import webpush

    vapid_private = load_vapid()
    subs = fetch_subscriptions()
    if not subs:
        print('⚠️ 没有已订阅的设备。请先在 PWA 设置中「启用推送」。')
        sys.exit(0)

    payload = json.dumps({
        'title': args.title,
        'body': args.body,
        'url': args.url,
        'tag': args.tag,
    }).encode('utf-8')

    targets = subs[:1] if args.test else subs
    ok = 0
    for s in targets:
        sub = {'endpoint': s['endpoint'], 'keys': {'p256dh': s['p256dh'], 'auth': s['auth']}}
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={'sub': 'mailto:dev@pmapp.io'},
            )
            ok += 1
            print(f'✓ 已推送 -> {s["endpoint"][:48]}...')
        except Exception as e:
            print(f'✗ 推送失败 {s["endpoint"][:48]}...: {e}')

    print(f'\n完成：成功 {ok}/{len(targets)} 条。')
    if args.test:
        print('（--test 仅发一条；去掉 --test 向全部订阅推送）')

if __name__ == '__main__':
    main()
