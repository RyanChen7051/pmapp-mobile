# CPWA Supabase Auth 迁移方案（让客户数据隔离 RLS 真正生效）

> 配套文档：`customer_data_isolation_rls.md`（已定义 RLS 策略与触发器 SQL，但当前因 CPWA 使用 anon key 而无法生效）。
> 本文目标是把"软隔离"（前端过滤）升级为"硬隔离"（RLS + per-user JWT），让 `customer_data_isolation_rls.md` 的策略真正落地。

---

## 0. 现状与痛点

| 项 | 现状 |
|---|---|
| 登录 | `renderLogin` / `doLogin` 仅本地比对 `CFG.accessCode`（`cpwa2026`）+ 客户代码下拉项 |
| 数据访问 | 全部走 **anon key**（`SUPABASE_KEY`），`H()` 头固定 `apikey` + `Bearer <anon>` |
| 隔离方式 | 客户端过滤：`loadFieldLog` 按 `customer_code` / `project` 过滤；`loadIssues` 按 `project_id` → `project_info.id` 过滤 |
| 风险 | anon key 可读全部 `sync_data`；任何拿到 anon key 的人都能绕过前端拉全量客户数据 |

**根因**：anon key 没有 per-user 身份，`auth.uid()` 为空，RLS 策略无法区分客户 → `customer_data_isolation_rls.md` 的策略形同虚设。

---

## 1. 目标

1. 每个客户 = 一个 Supabase Auth 用户；登录后 JWT 携带 `customer_code`。
2. `sync_data` 上启用 RLS，按 `payload->>'customer_code'`（field_log）与 `project_id → customer` 映射（issues）强制隔离。
3. 保留 anon 兼容期做灰度，平滑切换，可一键回滚。

---

## 2. 目标架构

```
客户浏览器(CPWA)
   │  登录: supabase.auth.signInWithPassword(customer_code@cpwa.local, pwd)
   ▼
Supabase Auth ──► JWT(access_token, 含 raw_user_meta_data.customer_code)
   │
   │  数据请求: Authorization: Bearer <JWT>
   ▼
Supabase REST /rest/v1/sync_data
   │
   │  RLS:  current_customer_code() = auth.uid() 的 customer_code
   ▼
仅返回该客户的数据（field_log.customer_code 命中 / issues 经项目映射命中）
```

`current_customer_code()` 助手：
```sql
create or replace function current_customer_code()
returns text language sql stable as $$
  select coalesce(raw_user_meta_data->>'customer_code', '')
  from auth.users where id = auth.uid()
$$;
```

---

## 3. 账号体系

- 每个客户在 `auth.users` 建一个用户：
  - `email` = `{customer_code}@cpwa.local`（或无邮箱时用 `phone`/`dummy`）
  - `raw_user_meta_data` = `{"customer_code": "...", "customer_name": "..."}`
- 建号入口（管理端）：桌面 PMApp 或 PWA 管理页调用 `supabase.auth.admin.createUser(...)`，初始随机密码。
- 首次登录强制改密（或 admin 分发明文一次性密码）。
- 与现有"客户基础资料"（`customer_info`）对齐：`customer_code` 即唯一标识，复用 `loadIdents` 的 `customer_info` 源。

---

## 4. RLS 策略（关键 SQL）

```sql
-- 4.1 启用 RLS
alter table sync_data enable row level security;

-- 4.2 项目归属助手：issues.project_id → projects.id == project_info.id → customer
create or replace function project_belongs_to_customer(pid int, code text)
returns boolean language sql stable as $$
  select exists (
    select 1 from project_info
    where id = pid
      and (customer_id = code
           or lower(customer_project_no) = lower(code)
           or lower(coalesce(customer_name_display,'')) like '%' || lower(code) || '%')
  )
$$;

-- 4.3 读隔离：field_log 按 customer_code；issues 按项目映射
drop policy if exists cpwa_isolation on sync_data;
create policy cpwa_isolation on sync_data
  for select using (
    (payload->>'table_name' = 'field_log'
       and payload->>'customer_code' = current_customer_code())
    or (payload->>'table_name' = 'issues'
       and project_belongs_to_customer((payload->>'project_id')::int, current_customer_code()))
  );

-- 4.4 写隔离（客户只能写自己的客诉 / 自己项目的 issues 评论）
drop policy if exists cpwa_write on sync_data;
create policy cpwa_write on sync_data
  for insert with check (
    payload->>'table_name' = 'field_log'
      and payload->>'customer_code' = current_customer_code()
  );
drop policy if exists cpwa_update on sync_data;
create policy cpwa_update on sync_data
  for update using (
    (payload->>'table_name' = 'field_log'
       and payload->>'customer_code' = current_customer_code())
    or (payload->>'table_name' = 'issues'
       and project_belongs_to_customer((payload->>'project_id')::int, current_customer_code()))
  );
```

> 注：`project_info` 在云端即桌面 `projects` 表（`sync_engine.py` 映射 `'projects':'project_info'`），故 `issues.project_id = projects.id = project_info.id`，映射成立。

---

## 5. CPWA 代码改动点（`pwa/variants/main.js`）

| 位置 | 改动 |
|---|---|
| `renderLogin` / `doLogin` | 改为调用 `supabase.auth.signInWithPassword`，不再比对 `CFG.accessCode`；成功后 `setSession({access_token, refresh_token, value: customer_code, name})` |
| `H()` | 由 `apikey` 固定头改为 `Authorization: Bearer <session.access_token>`（无会话时退回 anon，兼容灰度期） |
| `sbGet/sbPost/sbPatch` | 透传 `H()` 的鉴权头（已统一，无需大改） |
| `loadFieldLog` / `loadIssues` | **保留**客户端过滤作为 defense-in-depth 双保险；RLS 已是硬隔离 |
| `clearSession` / 注销 | 调用 `supabase.auth.signOut()` 失效 JWT |
| 401 处理 | `sbGet` 等捕获 401 → 用 `refresh_token` 刷新或跳登录 |

---

## 6. 灰度方案

- **阶段 1（现状保留）**：anon key 只读 + 客户端过滤；新增 Auth 登录为**可选**，写入仍用 anon。
- **阶段 2（开 RLS）**：启用 §4 策略；要求 JWT 鉴权。`anon` 角色 `auth.uid()` 为 null → 隔离结果为空（等于读不到数据），因此阶段 2 必须**全量切到 Auth 登录**，不能并存 anon 数据访问。
- **阶段 3（收口）**：撤销 anon key 对 `sync_data` 的读权限，强制 Auth。

---

## 7. 风险与回滚

- **账号分发成本**：首批 N 个客户需 admin 批量建号 + 分发密码。可用 `customer_info` 全量一次性建。
- **写路径失控**：必须同时加 §4.4 的 insert/update policy，否则客户可篡改他人记录。
- **回滚**：`drop policy cpwa_isolation / cpwa_write / cpwa_update` + `alter table sync_data disable row level security` 即退回软隔离现状。
- **JWT 过期**：CPWA 需实现 refresh 逻辑（阶段 1 即可先上），避免客户频繁重登。

---

## 8. 与 issues 二期的关系

- 本期已在 `db_init.py` 给 `issues` 加 `comments TEXT DEFAULT '[]'`，并在 `variants/main.js` 实现 `loadIssues` / `saveIssueRecord` / `issueCard`，客户可对内部问题留言。
- Auth 落地后：客户评论经 §4.4 的 update policy 写回 `issues.comments`，隔离由 `project_belongs_to_customer` 保证——客户 A 看不到客户 B 项目下的 issues，也改不了别人的 comments。
- 数据链路闭环：桌面 PMApp 创建 issues → 同步触发器写入 `sync_data`（table_name='issues'）→ CPWA（Auth）按项目映射读取 → 客户留言写回 `comments` → 桌面端下次同步可见。
