// ═══ PMApp 现场记录邮件通知（Supabase Edge Function）═══
// 触发：PWA 在保存现场记录成功后调用，传入该记录的 supabase_id。
// 本函数在服务端读取 sync_data 中对应的 field_log 记录（payload），
// 提取「负责处理人邮箱 / 报告人邮箱」及字段，用企业邮箱 SMTP 发送邮件。
// 负责处理人即使没装 PWA，也能在邮箱收到完整问题信息。
//
// 部署（需 Supabase CLI + 访问令牌）：
//   cd /Users/chenbangjie/WorkBuddy/PMApp/pwa
//   supabase login --token <ACCESS_TOKEN>
//   supabase link --project-ref nsnmtkukxquhinlmbejg
//   supabase functions deploy fieldlog-notify
// 配置密钥（SMTP 用「桌面端已配置的同一企业邮箱」）：
//   supabase secrets set SMTP_HOST=smtp.exmail.qq.com SMTP_PORT=465 \
//     SMTP_USER=xxx@gunbase.com SMTP_PASS=***** MAIL_FROM=xxx@gunbase.com
//
// 安全：verify_jwt=true，调用方须带有效 Supabase JWT（PWA 用 anon key）；
// 仅向「已写入该记录的」邮箱发信，无法向任意外部地址群发。

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.13';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SMTP_HOST = Deno.env.get('SMTP_HOST') || '';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465', 10);
const SMTP_USER = Deno.env.get('SMTP_USER') || '';
const SMTP_PASS = Deno.env.get('SMTP_PASS') || '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') || SMTP_USER;
const APP_URL = 'https://ryanchen7051.github.io/pmapp-mobile/';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

function buildHtml(rec: Record<string, any>, localId: number): string {
  const rows = [
    ['生产项目', rec.project],
    ['问题发生工厂', rec.problem_factory || rec.factory],
    ['问题类别', rec.problem_category],
    ['处理状态', rec.status],
    ['报告人', rec.reporter],
    ['报告人邮箱', rec.reporter_email],
    ['负责处理人邮箱', rec.responsible_email],
    ['现场定位', rec.gps],
    ['记录时间', rec.created_at],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:6px 10px;background:#f0f2f5;width:120px">${esc(
          k
        )}</th><td style="padding:6px 10px">${esc(String(v))}</td></tr>`
    )
    .join('');
  const desc = rec.description
    ? `<div style="margin-top:12px;padding:12px;background:#f5f5f5;border-radius:8px;white-space:pre-wrap;font-size:14px">${esc(
        rec.description
      )}</div>`
    : '';
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
    <h2 style="color:#1a1a1a">📸 新的现场记录待你处理</h2>
    <p style="color:#555">以下现场问题已记录，请及时处理：</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;border:1px solid #e0e0e0">${rows}</table>
    ${desc}
    <p style="margin-top:16px"><a href="${APP_URL}" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">打开 PMApp PWA 查看</a></p>
    <p style="color:#999;font-size:12px">记录 ID: ${esc(String(localId))} · 本邮件由 PMApp 自动发送</p>
  </div>`;
}

function buildText(rec: Record<string, any>, localId: number): string {
  return [
    '新的现场记录待你处理',
    '',
    `生产项目: ${rec.project || ''}`,
    `问题发生工厂: ${rec.problem_factory || rec.factory || ''}`,
    `问题类别: ${rec.problem_category || ''}`,
    `处理状态: ${rec.status || ''}`,
    `报告人: ${rec.reporter || ''}`,
    `记录时间: ${rec.created_at || ''}`,
    '',
    `问题叙述: ${rec.description || ''}`,
    '',
    `打开查看: ${APP_URL}`,
    `记录 ID: ${localId}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: '仅支持 POST' }, 405);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return json({ error: 'SMTP 未配置（请在 Supabase 设置 SMTP_HOST/USER/PASS 密钥）' }, 500);
  }

  let supabaseId = '';
  try {
    const d = await req.json();
    supabaseId = d.supabase_id || '';
  } catch {
    return json({ error: '请求体不是合法 JSON' }, 400);
  }
  if (!supabaseId) return json({ error: 'supabase_id 必填' }, 400);

  const { data, error } = await sb
    .from('sync_data')
    .select('payload, local_id')
    .eq('supabase_id', supabaseId)
    .maybeSingle();
  if (error || !data) return json({ error: error?.message || '记录不存在' }, 404);

  let rec: Record<string, any> = {};
  try {
    rec = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload || {};
  } catch {
    return json({ error: '记录 payload 解析失败' }, 500);
  }

  const to = String(rec.responsible_email || '').trim();
  const cc = String(rec.reporter_email || '').trim();
  if (!to || !EMAIL_RE.test(to)) return json({ sent: 0, note: '无有效负责处理人邮箱' }, 200);
  if (cc && !EMAIL_RE.test(cc)) return json({ sent: 0, note: '报告人邮箱格式无效' }, 200);

  const subject = `【现场记录待处理】${rec.project || '未指定项目'} · ${
    rec.problem_factory || rec.factory || '—'
  } (${rec.problem_category || '未分类'})`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      requireTLS: SMTP_PORT !== 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      cc: cc || undefined,
      subject,
      text: buildText(rec, data.local_id),
      html: buildHtml(rec, data.local_id),
    });
    return json({ sent: 1, to, cc: cc || null }, 200);
  } catch (e: any) {
    return json({ error: '邮件发送失败: ' + (e?.message || String(e)) }, 500);
  }
});
