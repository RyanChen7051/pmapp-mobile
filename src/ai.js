/* ═══ 智能海外助理（内嵌于首页）═══
 * 取代首页"进行中项目"区块，直接渲染在页面内（不再浮动）。
 * 后端地址存 Supabase(sync_data table_name='ai_config')，由超级管理员(admin)统一设定，
 * 所有人自动共享（不再每台设备各自设置）。本地 localStorage 仅作离线缓存。
 */
import { t } from './i18n.js';
import { SUPABASE_KEY } from './config.js';

export async function initAIAssistant() {
  const messagesEl = document.getElementById('ai-messages');
  const inputEl = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const settingsBtn = document.getElementById('ai-settings');
  const settingsBox = document.getElementById('ai-settings-box');
  const urlInput = document.getElementById('ai-url-input');
  const urlSave = document.getElementById('ai-url-save');
  if (!messagesEl || !inputEl || !sendBtn) return;

  const STORE_URL = 'pmapp_ai_url';
  // RAG 检索增强问答端点（Supabase Edge Function，自带知识库，无需额外后端）
  const RAG_FUNCTION_URL = 'https://nsnmtkukxquhinlmbejg.supabase.co/functions/v1/ai-rag-chat';
  // 缓存：优先本地（离线快），再从 Supabase 全局覆盖
  let cachedUrl = (localStorage.getItem(STORE_URL) || '').replace(/\/+$/, '');
  let aiCfgSbId = null; // ai_config 行的 supabase_id

  const getUrl = () => cachedUrl;

  // 从 Supabase 读取 admin 设定的全局后端地址
  async function refreshUrl() {
    try {
      const rows = await App.sbGet('sync_data', 'table_name=eq.ai_config&is_deleted=eq.false&limit=1&select=payload,supabase_id');
      if (rows && rows.length) {
        const p = JSON.parse((rows[0].payload || '{}'));
        if (p.url) {
          cachedUrl = p.url.replace(/\/+$/, '');
          localStorage.setItem(STORE_URL, cachedUrl);
          aiCfgSbId = rows[0].supabase_id;
        }
      }
    } catch (e) { /* 离线：保留本地缓存 */ }
  }

  // 仅超级管理员(admin)可见设置齿轮；admin2 / 其他用户不可见、不可修改
  // 智能助理已改为自带 RAG 函数，无需配置后端地址，因此隐藏设置齿轮
  if (settingsBtn) settingsBtn.style.display = 'none';
  const isSuper = !!(window.App && App.isSuperAdmin && App.isSuperAdmin());

  function greetingText() { return t('ai_greeting') || '你好，有什么问题，都可以问我。'; }

  function addMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg-wrap ' + (role === 'user' ? 'user' : 'bot');
    const div = document.createElement('div');
    div.className = 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
    div.textContent = text;
    wrap.appendChild(div);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // 回答完毕后约 15 秒自动恢复到初始问候状态
  let resetTimer = null;
  function clearReset() { if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; } }
  function scheduleReset() {
    clearReset();
    resetTimer = setTimeout(() => {
      messagesEl.innerHTML = '';
      history.length = 0;
      addMsg('bot', greetingText());
    }, 15000);
  }

  // admin 保存：写入 Supabase 全局共享（所有人自动生效），本地仅作缓存
  async function saveGlobalUrl(v) {
    v = v.replace(/\/+$/, '');
    cachedUrl = v;
    localStorage.setItem(STORE_URL, v);
    const now = new Date().toISOString();
    try {
      if (aiCfgSbId) {
        await App.sbPatch('sync_data', `supabase_id=eq.${aiCfgSbId}`, {
          payload: JSON.stringify({ url: v }),
          updated_at: now,
          device_id: App.deviceId || 'ai-config',
        });
      } else {
        const res = await App.sbPost('sync_data', {
          table_name: 'ai_config',
          local_id: 1,
          payload: JSON.stringify({ url: v }),
          supabase_id: App.uuid(),
          is_deleted: false,
          updated_at: now,
          device_id: App.deviceId || 'ai-config',
        });
        if (res && res[0]) aiCfgSbId = res[0].supabase_id;
      }
    } catch (e) { /* 仍已存本地缓存 */ }
  }

  if (settingsBtn) settingsBtn.addEventListener('click', () => {
    const show = settingsBox.style.display !== 'block';
    settingsBox.style.display = show ? 'block' : 'none';
    if (show) urlInput.value = getUrl();
  });
  if (urlSave) urlSave.addEventListener('click', async () => {
    const v = urlInput.value.trim();
    if (!v) { alert(t('ai_url_required') || '请输入 AI 后端地址'); return; }
    await saveGlobalUrl(v);
    settingsBox.style.display = 'none';
    messagesEl.innerHTML = '';
    history.length = 0;
    addMsg('bot', t('ai_url_saved') || '✅ 已设置 AI 后端，可以开始提问了（所有人立即共享此地址）。');
    scheduleReset();
  });

  const history = []; // [{role, content}]
  async function send() {
    clearReset();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    const typing = addMsg('bot', t('ai_thinking') || '智能海外助理 正在思考…');
    try {
      // 直接调用自带 RAG 函数（检索知识库 + 智谱生成），无需额外后端
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
      };
      // 携带当前登录用户名，供函数端做「已登录用户」门禁与归因
      const callerName = (window.App && App.session && App.session.user && App.session.user.username) || '';
      if (callerName) headers['x-pmapp-user'] = callerName;
      const resp = await fetch(RAG_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));
      const reply = data.reply || '(无回复)';
      typing.textContent = reply;
      // 渲染引用来源
      if (Array.isArray(data.citations) && data.citations.length) {
        const cite = document.createElement('div');
        cite.className = 'ai-citations';
        cite.textContent = '📚 来源：' + data.citations.map(c => `${c.table}#${c.id}`).join('，');
        cite.style.fontSize = '12px';
        cite.style.opacity = '0.7';
        cite.style.marginTop = '4px';
        typing.parentElement.appendChild(cite);
      }
      history.push({ role: 'assistant', content: reply });
      scheduleReset(); // 回答完成后约 15 秒自动恢复
    } catch (e) {
      typing.textContent = (t('ai_call_fail') || '❌ 调用失败：') + e.message + '\n' + (t('ai_call_fail_hint') || '请确认网络可访问 Supabase。');
    }
  }
  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  inputEl.addEventListener('input', clearReset);

  // 先从 Supabase 取全局地址，再渲染首屏问候（保证"未设定"提示准确）
  await refreshUrl();
  // 迁移：本地已有地址但全局未设，且为超级管理员 → 自动写入全局共享
  if (!aiCfgSbId && cachedUrl && isSuper) {
    await saveGlobalUrl(cachedUrl);
  }
  if (messagesEl.children.length === 0) {
    addMsg('bot', greetingText());
  }
}
