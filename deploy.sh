#!/bin/bash
# PMApp PWA v3.7.0 部署脚本
echo "======================================"
echo "  PMApp PWA v3.7.0 部署到 GitHub Pages"
echo "  (会议记录功能 + 周/月报栏目改名)"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# ─────────────────────────────────────
# 1. 检查 VPN 状态
# ─────────────────────────────────────
echo "[1/5] 检查 VPN 状态..."
HTTP_CODE=$(curl -s --max-time 5 --noproxy '*' -o /dev/null -w "%{http_code}" "https://api.github.com" 2>/dev/null)
if echo "$HTTP_CODE" | grep -q "200\|301\|302"; then
    echo "  ✓ GitHub API 可访问"
else
    echo "  ⚠ GitHub API 不可访问（VPN 可能正在运行）"
    echo "  请先关闭 Shadowrocket/VPN，然后重新运行此脚本"
    echo ""
    echo "  或者使用 GitHub REST API 推送："
    echo "  /usr/bin/python3 push_github_api.py"
    exit 1
fi
echo ""

# ─────────────────────────────────────
# 2. 构建 bundle.js
# ─────────────────────────────────────
echo "[2/5] 正在构建 bundle.js..."
if [ ! -f "node_modules/esbuild/bin/esbuild" ]; then
    echo "  ⚠ esbuild 未安装，正在安装..."
    /Users/chenbangjie/.workbuddy/binaries/node/versions/22.22.2/bin/npm install esbuild --save-dev --registry https://registry.npmmirror.com 2>&1 | tail -3
fi
./node_modules/esbuild/bin/esbuild src/app.js --bundle --outfile=bundle.js --format=iife --target=es2020 --minify --banner:js="/* PMApp Mobile v3.9.0 — Bundled by esbuild */"
echo "  bundle.js 大小: $(wc -c < bundle.js) bytes"
echo ""

# ─────────────────────────────────────
# 3. 提交代码
# ─────────────────────────────────────
echo "[3/5] 正在提交代码..."
git add index.html bundle.js sw.js src/ build.sh .gitignore package.json deploy.sh push_github_api.py 2>/dev/null
git diff --cached --quiet
if [ $? -eq 0 ]; then
    echo "  无变更需提交"
else
    git commit -m "feat: 周/月报栏目新增会议记录功能 + 顶栏改名周/月报、会议记录 (v3.7.0)" >/dev/null
    echo "  已提交"
fi
echo ""

# ─────────────────────────────────────
# 4. 推送到 GitHub
# ─────────────────────────────────────
echo "[4/5] 正在推送到 GitHub..."

# 从 osxkeychain 读取 token 自动配置
TOKEN=$(echo "host=github.com
protocol=https" | git credential-osxkeychain get 2>/dev/null | grep "^password=" | cut -d= -f2)
if [ -n "$TOKEN" ]; then
    echo "  ✓ 已从 keychain 读取 GitHub token"
    # 用 token 临时设置 push URL，避免交互式输入
    git push https://RyanChen7051:${TOKEN}@github.com/RyanChen7051/pmapp-mobile.git main 2>&1
    PUSH_RESULT=$?
else
    echo "  ⚠ 未找到 token，尝试普通推送..."
    git push origin main 2>&1
    PUSH_RESULT=$?
fi

if [ $PUSH_RESULT -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "  ✓ 推送成功"
    echo "======================================"
    echo ""
    echo "[5/5] GitHub Pages 将在 1-2 分钟内自动部署"
    echo "访问: https://ryanchen7051.github.io/pmapp-mobile/"
    echo ""
    echo "在手机上打开 PWA -> 设定 -> 立即同步"
    echo "新界面将自动更新 (SW v21 会自动清理旧缓存)"
else
    echo ""
    echo "  ✗ 推送失败，尝试使用 GitHub REST API..."
    /usr/bin/python3 push_github_api.py
fi
echo ""
