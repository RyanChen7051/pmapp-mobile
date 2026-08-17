-- ═══ PMApp Web Push 订阅表（Apple Watch 镜像通知 路径 A）═══
-- 在 Supabase 控制台的 SQL Editor 中执行本文件一次即可。

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  device_id  text,
  username   text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_endpoint
  on public.push_subscriptions(endpoint);

-- RLS：个人工具，本表仅存放浏览器推送端点（非敏感信息），
-- 允许 anon（PWA 使用的 publishable key）读写以便前端自助订阅/退订。
alter table public.push_subscriptions enable row level security;

drop policy if exists "anon_push_all" on public.push_subscriptions;
create policy "anon_push_all" on public.push_subscriptions
  for all to anon
  using (true) with check (true);
