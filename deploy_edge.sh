#!/bin/bash
# 部署 fieldlog-notify Edge Function 并设置 SMTP 密钥
# 用法：SUPABASE_ACCESS_TOKEN=xxxx bash deploy_edge.sh
set -e
cd "$(dirname "$0")"

: "${SUPABASE_ACCESS_TOKEN:?请先设置环境变量 SUPABASE_ACCESS_TOKEN（Supabase 个人访问令牌 https://supabase.com/dashboard/account/tokens）}"

# 安装 CLI（若未安装）
if ! command -v supabase >/dev/null 2>&1; then
  echo "安装 supabase CLI ..."
  npm install -g supabase@latest --registry https://registry.npmmirror.com
fi

supabase login --token "$SUPABASE_ACCESS_TOKEN"
supabase link --project-ref nsnmtkukxquhinlmbejg

echo "== 部署 fieldlog-notify =="
supabase functions deploy fieldlog-notify

echo ""
echo "== 部署完成。请设置 SMTP 密钥（用「桌面端 email_module 已配置的同一企业邮箱」）=="
echo "在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 添加："
echo "  SMTP_HOST   例如 smtp.exmail.qq.com / smtp.office365.com"
echo "  SMTP_PORT   465 (SSL) 或 587 (STARTTLS)"
echo "  SMTP_USER   发信邮箱账号"
echo "  SMTP_PASS   发信邮箱密码 / 授权码"
echo "  MAIL_FROM   发信人显示地址（默认同 SMTP_USER）"
echo ""
echo "或用命令一键设置（把值替换成你的）："
echo "  supabase secrets set SMTP_HOST=smtp.exmail.qq.com SMTP_PORT=465 SMTP_USER=you@gunbase.com SMTP_PASS='****' MAIL_FROM=you@gunbase.com"
