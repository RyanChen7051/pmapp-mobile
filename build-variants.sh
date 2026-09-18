#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PMApp 外部协作端构建脚本
#   同一份 variants/main.js，注入不同 __VARIANT__ → FPWA / CPWA 两份产物
#   用法: bash build-variants.sh [版本号]   例: bash build-variants.sh 3
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"

VER="${1:-1}"
ESBUILD="./node_modules/esbuild/bin/esbuild"

echo "═══ 构建外部协作端 (版本 v${VER}) ═══"

# 1) 打包两份 bundle
echo "[1/3] esbuild 打包…"
$ESBUILD variants/main.js --bundle --outfile=fpwa/bundle.js --format=iife \
  --target=es2020 --minify --define:__VARIANT__='"factory"' \
  --banner:js="/* FPWA — PMApp Factory Portal v0.1.0 (build ${VER}) */"
echo "  ✓ fpwa/bundle.js  $(wc -c < fpwa/bundle.js) bytes"

$ESBUILD variants/main.js --bundle --outfile=cpwa/bundle.js --format=iife \
  --target=es2020 --minify --define:__VARIANT__='"customer"' \
  --banner:js="/* CPWA — PMApp Customer Portal v0.1.0 (build ${VER}) */"
echo "  ✓ cpwa/bundle.js  $(wc -c < cpwa/bundle.js) bytes"

# 2) 生成各自的 index.html / manifest.json / sw.js
echo "[2/3] 生成页面与清单…"
python3 - "$VER" <<'PYEOF'
import sys, os, shutil
VER = sys.argv[1]

VARIANTS = {
    'fpwa': dict(
        variant='factory', code='FPWA', cache='pmapp-fpwa', swpre='fpwa',
        name='PMApp Factory Portal', title='PMApp 工厂端 FPWA',
        theme='#1e6b3a', themedark='#155230', accbg='#eaf5ec',
    ),
    'cpwa': dict(
        variant='customer', code='CPWA', cache='pmapp-cpwa', swpre='cpwa',
        name='PMApp Customer Portal', title='PMApp 客户端 CPWA',
        theme='#0e5a8a', themedark='#0a4370', accbg='#e8f2f9',
    ),
}

def sub(tpl, d, ver):
    out = tpl
    for k, v in d.items():
        out = out.replace('__%s__' % k.upper(), v)
    return out.replace('__VER__', ver)

os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')

for folder, d in VARIANTS.items():
    os.makedirs(folder, exist_ok=True)

    html = sub(open('variants/index.template.html', encoding='utf-8').read(), d, VER)
    open(f'{folder}/index.html', 'w', encoding='utf-8').write(html)

    mf = sub(open('variants/manifest.template.json', encoding='utf-8').read(), d, VER)
    open(f'{folder}/manifest.json', 'w', encoding='utf-8').write(mf)

    sw = sub(open('variants/sw.template.js', encoding='utf-8').read(), d, VER)
    open(f'{folder}/sw.js', 'w', encoding='utf-8').write(sw)

    for ic in ('icon-192.png', 'icon-512.png'):
        if os.path.exists(ic) and not os.path.exists(f'{folder}/{ic}'):
            shutil.copy(ic, f'{folder}/{ic}')

    print(f'  ✓ {folder}/ index.html + manifest.json + sw.js')
PYEOF

# 3) 注册 Service Worker（页面里注入）
echo "[3/3] 注入 SW 注册…"
python3 - <<'PYEOF'
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
REG = """
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').catch(function(e){ console.warn('SW', e); });
  });
}
</script>
</body>"""
for f in ('fpwa/index.html', 'cpwa/index.html'):
    s = open(f, encoding='utf-8').read()
    if 'serviceWorker.register' not in s:
        s = s.replace('</body>', REG, 1)
        open(f, 'w', encoding='utf-8').write(s)
    print(f'  ✓ {f}')
PYEOF

echo ""
echo "═══ 构建完成 v${VER} ═══"
echo "  FPWA: https://ryanchen7051.github.io/pmapp-mobile/fpwa/"
echo "  CPWA: https://ryanchen7051.github.io/pmapp-mobile/cpwa/"
echo ""
