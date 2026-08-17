#!/usr/bin/env python3
"""
PWA ↔ PMApp 连通性与数据同步一致性自检
============================================
每次 PWA 或桌面端发生功能变动后运行，检查三方数据视图是否一致：

  A. 桌面端本地 SQLite  (~/Library/Application Support/PMApp/database.sqlite)
  B. 云端 Supabase       (sync_data 表，按 table_name 分组)
  C. PWA 前端            (src/config.js 的 MODULES + 额外表)

输出四类问题：
  [孤岛-桌面]  桌面端在同步、云端有数据，但 PWA 无入口 → 手机端看不到
  [悬空-PWA]   PWA 有入口，但云端无数据 → 页面永远空白
  [未上云]     桌面端本地有数据，但云端查不到 → 同步未跑/失败
  [连通性]     Supabase / GitHub Pages 可达性

用法： python3 check_sync_parity.py
"""
import json
import os
import re
import sqlite3
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

PWA_DIR = Path(__file__).resolve().parent
DB_PATH = Path.home() / "Library/Application Support/PMApp/database.sqlite"
PAGES_URL = "https://ryanchen7051.github.io/pmapp-mobile/"

# 与 modules/sync_engine.py 的 _EXCLUDED_TABLES 保持一致
EXCLUDED_TABLES = {
    'sync_queue', 'sync_state', 'sync_conflicts', 'sync_settings',
    'audit_log', 'backup_log', 'backup_settings',
    'api_call_log', 'api_keys', 'webhooks',
    'iot_data_points',
    'user_roles', 'role_permissions',
}

_SSL = ssl.create_default_context()


def _c(code, s):
    return f"\033[{code}m{s}\033[0m" if sys.stdout.isatty() else s


red = lambda s: _c('31', s)
grn = lambda s: _c('32', s)
yel = lambda s: _c('33', s)
cya = lambda s: _c('36', s)
bold = lambda s: _c('1', s)


# ─────────────── A. 桌面端本地 SQLite ───────────────

def local_tables():
    """返回 {table: rowcount}，已应用同步排除规则"""
    if not DB_PATH.exists():
        print(red(f"  ! 本地数据库不存在: {DB_PATH}"))
        return {}
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    c = conn.cursor()
    c.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    rows = c.fetchall()
    out = {}
    for name, sql in rows:
        if name in EXCLUDED_TABLES or name.startswith('fts_'):
            continue
        if sql and 'CREATE VIRTUAL TABLE' in sql.upper():
            continue
        try:
            c.execute(f'SELECT COUNT(*) FROM "{name}"')
            out[name] = c.fetchone()[0]
        except Exception:
            out[name] = -1
    conn.close()
    return out


# ─────────────── B. 云端 Supabase ───────────────

def _pwa_conf():
    src = (PWA_DIR / "src/config.js").read_text(encoding="utf-8")
    url = re.search(r"SUPABASE_URL\s*=\s*'([^']+)'", src).group(1)
    key = re.search(r"SUPABASE_KEY\s*=\s*'([^']+)'", src).group(1)
    return url, key


def cloud_tables(url, key):
    """返回 {table_name: rowcount}（云端 sync_data 未删除的记录）"""
    counts = {}
    # 先取全部 distinct table_name（分页拉取 table_name 列）
    seen = {}
    offset, page = 0, 1000
    while True:
        q = f"{url}/rest/v1/sync_data?select=table_name&is_deleted=eq.false&limit={page}&offset={offset}"
        req = urllib.request.Request(q, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
        })
        try:
            with urllib.request.urlopen(req, timeout=30, context=_SSL) as r:
                batch = json.loads(r.read().decode())
        except Exception as e:
            print(red(f"  ! Supabase 查询失败: {e}"))
            return None
        if not batch:
            break
        for row in batch:
            t = row.get("table_name")
            seen[t] = seen.get(t, 0) + 1
        if len(batch) < page:
            break
        offset += page
    counts.update(seen)
    return counts


# ─────────────── C. PWA 前端表清单 ───────────────

def pwa_tables():
    src = (PWA_DIR / "src/config.js").read_text(encoding="utf-8")
    tables = set(re.findall(r"table:\s*'([a-z_]+)'", src))
    # 非 MODULES 驱动、代码里直连的表
    for js in (PWA_DIR / "src").glob("*.js"):
        body = js.read_text(encoding="utf-8")
        tables |= set(re.findall(r"fetchSyncData\(\s*'([a-z_]+)'", body))
    return tables


# ─────────────── 连通性 ───────────────

def probe(name, url, key=None):
    headers = {"apikey": key, "Authorization": f"Bearer {key}"} if key else {}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20, context=_SSL) as r:
            print(f"  {grn('OK')}   {name}: HTTP {r.status}")
            return True
    except urllib.error.HTTPError as e:
        ok = e.code < 500
        print(f"  {(grn('OK') if ok else red('FAIL'))}   {name}: HTTP {e.code}")
        return ok
    except Exception as e:
        print(f"  {red('FAIL')} {name}: {e}")
        return False


def main():
    url, key = _pwa_conf()

    print(bold("\n═══ 1. 连通性 ═══"))
    probe("Supabase REST", f"{url}/rest/v1/sync_data?select=id&limit=1", key)
    probe("GitHub Pages", PAGES_URL)
    print(f"  {'OK  ' if DB_PATH.exists() else 'FAIL'}   本地 SQLite: {DB_PATH.name} "
          f"({DB_PATH.stat().st_size // 1048576}MB)" if DB_PATH.exists() else red("  FAIL 本地 SQLite 缺失"))

    print(bold("\n═══ 2. 版本一致性 ═══"))
    html = (PWA_DIR / "index.html").read_text(encoding="utf-8")
    sw = (PWA_DIR / "sw.js").read_text(encoding="utf-8")
    cfg = (PWA_DIR / "src/config.js").read_text(encoding="utf-8")
    v_html = re.search(r"bundle\.js\?v=(\d+)", html).group(1)
    v_sw = re.search(r"VERSION\s*=\s*'v(\d+)'", sw).group(1)
    v_app = re.search(r"APP_VERSION\s*=\s*'([^']+)'", cfg).group(1)
    same = v_html == v_sw
    print(f"  index.html ?v={v_html} / sw.js v{v_sw} / APP_VERSION {v_app}  "
          f"→ {grn('一致') if same else red('不一致，手机会读旧缓存！')}")

    print(bold("\n═══ 3. 数据同步一致性 ═══"))
    L = local_tables()
    C = cloud_tables(url, key)
    P = pwa_tables()
    if C is None:
        print(red("  云端不可达，跳过差集分析"))
        return 1

    print(f"  桌面端可同步表 {len(L)} 张 / 云端有数据表 {len(C)} 张 / PWA 有入口表 {len(P)} 张\n")

    # 孤岛：云端有数据 + PWA 无入口
    island = sorted([t for t in C if t not in P and C[t] > 0],
                    key=lambda t: -C[t])
    if island:
        print(yel(f"  [孤岛-桌面] {len(island)} 张表云端有数据但 PWA 看不到:"))
        for t in island[:20]:
            print(f"      {t:<32} 云端 {C[t]:>6} 条  (本地 {L.get(t, '—')})")
        if len(island) > 20:
            print(f"      … 另有 {len(island) - 20} 张")
    else:
        print(grn("  [孤岛-桌面] 无"))

    # 悬空：PWA 有入口 + 云端无数据
    dangling = sorted([t for t in P if C.get(t, 0) == 0])
    if dangling:
        print(red(f"\n  [悬空-PWA] {len(dangling)} 张表 PWA 有入口但云端无数据（页面会空白）:"))
        for t in dangling:
            print(f"      {t:<32} 本地 {L.get(t, '不存在')}")
    else:
        print(grn("  [悬空-PWA] 无"))

    # 未上云：本地有数据 + 云端为 0
    notup = sorted([t for t, n in L.items() if n > 0 and C.get(t, 0) == 0],
                   key=lambda t: -L[t])
    if notup:
        print(yel(f"\n  [未上云] {len(notup)} 张表本地有数据但云端为空:"))
        for t in notup[:15]:
            print(f"      {t:<32} 本地 {L[t]:>6} 条")
        if len(notup) > 15:
            print(f"      … 另有 {len(notup) - 15} 张")
    else:
        print(grn("\n  [未上云] 无"))

    # 双向健康表
    healthy = sorted([t for t in P if C.get(t, 0) > 0])
    print(grn(f"\n  [双向连通] {len(healthy)} 张表两端都可见: ") + ", ".join(healthy))

    rc = queue_health()

    print()
    return rc


# ─────────────── 4. 同步队列健康度 ───────────────

def queue_health():
    """检查桌面端 sync_queue 积压 / 失败 / 写放大"""
    print(bold("\n═══ 4. 同步队列健康度（桌面端 → 云端）═══"))
    if not DB_PATH.exists():
        print(red("  本地库缺失，跳过"))
        return 1
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    c = conn.cursor()
    try:
        c.execute("SELECT status, COUNT(*) FROM sync_queue GROUP BY status")
        st = dict(c.fetchall())
    except sqlite3.OperationalError:
        print("  无 sync_queue 表，跳过")
        conn.close()
        return 0

    total = sum(st.values())
    pend, fail = st.get('pending', 0), st.get('failed', 0)
    print(f"  队列总量 {total:,}   pending {pend:,}   failed {fail:,}   pushed {st.get('pushed', 0):,}")

    bad = 0
    if pend > 500:
        print(red(f"  ! 待推送积压 {pend:,} 条（阈值 500）→ 手机端看到的是滞后数据"))
        bad = 1
    if fail > 100:
        print(red(f"  ! 推送失败 {fail:,} 条（阈值 100）"))
        c.execute("SELECT substr(COALESCE(last_error,'(null)'),1,70) e, COUNT(*) "
                  "FROM sync_queue WHERE status='failed' GROUP BY e ORDER BY 2 DESC LIMIT 3")
        for err, n in c.fetchall():
            print(f"      [{n:>5}] {err}")
        bad = 1

    # 写放大：队列条数 / 实际行数 比值异常
    c.execute("SELECT table_name, COUNT(*) FROM sync_queue GROUP BY table_name ORDER BY 2 DESC LIMIT 5")
    top = c.fetchall()
    amp = []
    for t, qn in top:
        try:
            c.execute(f'SELECT COUNT(*) FROM "{t}"')
            rn = c.fetchone()[0] or 1
        except Exception:
            rn = 1
        ratio = qn / rn
        if ratio > 100:
            amp.append((t, qn, rn, ratio))
    if amp:
        print(red(f"\n  ! 检测到写放大（同一批记录被反复入队，疑似无 WHERE 的 UPDATE 或高频定时器）:"))
        for t, qn, rn, ratio in amp:
            print(f"      {t:<30} 队列 {qn:>7,} 条 / 实际 {rn:>4} 行 = {ratio:>7.0f}x")
        bad = 1
    else:
        print(grn("  写放大检查：正常"))

    conn.close()
    return bad


if __name__ == "__main__":
    sys.exit(main())
