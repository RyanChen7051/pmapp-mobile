# CPWA 客户数据隔离 — Supabase RLS 策略

> 起草日期：2026-09-18 · 适用：PMApp 外部协作端 CPWA / FPWA 与 PWA 共用 Supabase 后端

## 1. 现状审计（必须看清的前提）

| 项 | 事实 |
|---|---|
| 存储位置 | `field_log` **不是** Supabase 独立表，而是写入通用同步表 `sync_data`：`table_name='field_log'`、`payload` 为 jsonb（含 `customer_code` / `customer_name` / `is_customer_complaint` / `project_no` / `comments` 等） |
| 同步表结构 | `sync_data(supabase_id PK, table_name text, payload jsonb, updated_at, device_id, is_deleted bool, local_id)` |
| 访问身份 | CPWA 与公开 PWA **共用 anon key**（仅本地 `accessCode` 校验，无 Supabase Auth 用户） |
| 当前隔离 | 客户端 JS 按 `payload->>'customer_code'` 软过滤 —— **纯前端隔离，网络层无约束** |

**结论**：在「不改访问模型」的前提下，**纯 RLS 无法隔离客户数据**。因为 anon key 没有"当前客户是谁"的身份，RLS 无法区分 `customer_code`。任何懂技术的客户都能在浏览器网络面板直接 `GET /rest/v1/sync_data?table_name=eq.field_log` 读到全部客户的客诉（含客户代码、客户名、项目号、问题描述）。这是上线前必须正视的泄露面。

## 2. 推荐方案：CPWA 改用 Supabase Auth + RLS（根治）

让每个客户 = 一个 Supabase Auth 用户，登录后 JWT 携带 `customer_code`，RLS 据此隔离 `sync_data` 中 `field_log` 行。

### 2.1 角色分工（关键）
- **桌面端 / 内部 PMApp** → `service_role` key：Supabase 中 service_role **始终绕过 RLS**，现有同步不受影响。
- **公开 PWA（内部工厂人员）** → `anon` key：需要看**全部** `field_log`（内部协作），保留全量读权限。
- **CPWA（外部客户）** → `authenticated` 角色：仅看自己 `customer_code` 的 `field_log` 行。

> 区分点：CPWA 与公开 PWA 必须用**不同身份**（authenticated vs anon）。共用 anon 时 RLS 无法只隔离 CPWA 而不误伤内部 PWA。

### 2.2 迁移步骤
1. CPWA 登录从本地 `accessCode` 改为 Supabase Auth `signInWithPassword`（每客户 = auth 用户，邮箱/密码或 magic link）。
2. 建客户用户时写入 metadata：
   ```sql
   -- 通过 supabase auth.admin 或触发器写入
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"customer_code":"CUST-001"}'::jsonb
   where email = 'client@customer.com';
   ```
3. CPWA 写入 `field_log` 时，`customer_code` 不再信任客户端传入，改由服务端从 JWT 取（见 §2.3 触发器）。
4. 前端 `loadFieldLog()` 改为带 `Authorization: Bearer <用户 JWT>`，不再用 anon。

### 2.3 RLS SQL（在 Supabase SQL Editor 执行）

```sql
-- ════════════════════════════════════════════════════════════
-- 1) 启用 RLS（仅约束 anon / authenticated；service_role 自动 bypass）
-- ════════════════════════════════════════════════════════════
alter table sync_data enable row level security;

-- ════════════════════════════════════════════════════════════
-- 2) 内部/公开 PWA（anon）仍可读全部 field_log（内部协作需要）
--    注：CPWA 迁移到 authenticated 后不再依赖此条
-- ════════════════════════════════════════════════════════════
drop policy if exists "anon_read_all" on sync_data;
create policy "anon_read_all" on sync_data
  for select to anon using (true);

-- ════════════════════════════════════════════════════════════
-- 3) CPWA（authenticated）按 customer_code 隔离 field_log
--    非 field_log 的表（projects/issues/customer_info 等）不受影响
--    隔离键取 JWT 的 app_metadata.customer_code
-- ════════════════════════════════════════════════════════════
drop policy if exists "cpwa_field_log_isolation" on sync_data;
create policy "cpwa_field_log_isolation" on sync_data
  for all to authenticated
  using (
    table_name <> 'field_log'
    or payload->>'customer_code' = (auth.jwt() -> 'app_metadata' ->> 'customer_code')
  )
  with check (
    table_name <> 'field_log'
    or payload->>'customer_code' = (auth.jwt() -> 'app_metadata' ->> 'customer_code')
  );

-- ════════════════════════════════════════════════════════════
-- 4) 写入时强制 customer_code 取自 JWT（防客户端伪造）
--    用触发器覆盖 payload 里的 customer_code，客户端传的值被忽略
-- ════════════════════════════════════════════════════════════
create or replace function enforce_cpwa_customer_code() returns trigger as $$
declare v_code text;
begin
  v_code := (auth.jwt() -> 'app_metadata' ->> 'customer_code');
  if NEW.table_name = 'field_log' and v_code is not null then
    NEW.payload := NEW.payload || jsonb_build_object('customer_code', v_code);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_cpwa_customer_code on sync_data;
create trigger trg_cpwa_customer_code
  before insert or update on sync_data
  for each row execute function enforce_cpwa_customer_code();
```

### 2.4 验证
```sql
-- 以某客户 JWT 调用，应只返回自己 customer_code 的 field_log
select supabase_id, payload->>'customer_code', payload->>'problem_category'
from sync_data where table_name = 'field_log' limit 20;
-- 预期：所有行 payload->>'customer_code' = 该客户代码
```

## 3. 过渡期加固（不改访问模型时的临时方案）

若暂不能迁移到 Supabase Auth，可二选一：

- **A. 独立受限角色（运维重）**：为 CPWA 建独立 Postgres 角色 + 自定义 JWT（`cpwa_client` 角色），上面 policy 的 `to authenticated` 改为 `to cpwa_client`。需自建 JWT 签发服务，工作量等同于 Auth 方案。
- **B. 接受风险 + 最小化暴露（推荐临时）**：
  - 公开 PWA / CPWA 的 anon key **仅授予 `select`**，关闭 `insert/update/delete`（写入改走桌面端 service_role 或受限 Edge Function 代理）；
  - CPWA 查询始终带 `customer_code=eq.<本客户>` 服务端过滤（减少误读，但仍非硬隔离）；
  - 在 `sync_data` 上对 `field_log` 的 `payload` 敏感字段（客户名、项目号）做**应用层脱敏**，仅对本客户显示明文；
  - 明确告知：此为临时方案，懂技术客户仍可在网络层看到其他客户记录，**迁移到 §2 前不得承载高敏感客诉**。

## 4. 落地建议
1. 先上 §2 的 RLS（即使 CPWA 尚未切 Auth，也不会破坏现有 anon 内部 PWA）；
2. CPWA 登录改造（§2.1-2.2）与 RLS 同期排期；
3. RLS 上线后用 §2.4 验证隔离；触发器和 policy 需在 **生产 Supabase 项目** SQL Editor 执行（本仓库不自动应用）。
