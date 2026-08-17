// ═══ PMApp 留言→Web Push 推送（Supabase Edge Function 云端方案）═══
// 用途：PWA 留言入库后自动向所有订阅设备推送（Apple Watch 镜像）。
// 优点：部署在 Supabase 云端，不依赖本地 Mac 是否开机（本地方案见 push_watchdog.py）。
//
// ═══ 部署步骤（需 Supabase CLI，或 dashboard 手动部署）═══
// 1) 本目录即为 supabase/functions/push-notify/index.ts
//    cd /Users/chenbangjie/WorkBuddy/PMApp/pwa
//    supabase login
//    supabase link --project-ref nsnmtkukxquhinlmbejg
// 2) 配置密钥（VAPID 私钥只存服务端，勿提交前端）：
//    supabase secrets set VAPID_PUBLIC_KEY="<vapid_keys.json 的 publicKey>"
//    supabase secrets set VAPID_PRIVATE_KEY="<vapid_keys.json 的 privateKey>"
// 3) 部署：
//    supabase functions deploy push-notify
// 4) 触发方式 A（推荐）：在 PWA postMessage 成功后调用
//    fetch('https://nsnmtkukxquhinlmbejg.supabase.co/functions/v1/push-notify', {
//      method: 'POST',
//      headers: { 'Content-Type': 'application/json',
//                 'Authorization': 'Bearer <SUPABASE_KEY>' },
//      body: JSON.stringify({ title: '💬 ' + name + ' 留言', body: content.slice(0, 80) }),
//    });
//    触发方式 B（更自动）：Supabase Dashboard → Database → Webhooks
//    新建 webhook：表 sync_data、事件 INSERT、条件 table_name='message_board'
//    → 目标选择本 Edge Function。

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:dev@pmapp.io', VAPID_PUBLIC, VAPID_PRIVATE);
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST' }), { status: 405 });
  }
  let title = 'PMApp 新留言';
  let body = '';
  try {
    const data = await req.json();
    title = data.title || title;
    body = data.body || '';
  } catch {
    /* 忽略 body 解析错误，用默认值 */
  }
  if (!body) {
    return new Response(JSON.stringify({ error: 'body 不能为空' }), { status: 400 });
  }

  const { data: subs, error } = await sb
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, note: '无订阅设备' }), { status: 200 });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: 'https://ryanchen7051.github.io/pmapp-mobile/',
    tag: 'pmapp-message',
  });

  let sent = 0;
  let failed = 0;
  const deadEndpoints = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      sent++;
    } catch (e) {
      failed++;
      // 410 Gone / 404 表示订阅已失效，清理掉
      const code = e?.statusCode ?? 0;
      if (code === 410 || code === 404) {
        deadEndpoints.push(s.endpoint);
      }
    }
  }
  if (deadEndpoints.length > 0) {
    await sb.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
  }
  return new Response(JSON.stringify({ sent, failed, cleaned: deadEndpoints.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
