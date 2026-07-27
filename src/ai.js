/* ═══ 智能海外助理（内嵌于首页）═══
 * 取代首页"进行中项目"区块，直接渲染在页面内（不再浮动）。
 * 后端地址存 localStorage('pmapp_ai_url')，点 ⚙️ 设置。
 */
import { t } from './i18n.js';

export function initAIAssistant() {
  const messagesEl = document.getElementById('ai-messages');
  const inputEl = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const settingsBtn = document.getElementById('ai-settings');
  const settingsBox = document.getElementById('ai-settings-box');
  const urlInput = document.getElementById('ai-url-input');
  const urlSave = document.getElementById('ai-url-save');
  if (!messagesEl || !inputEl || !sendBtn) return;

  const STORE_URL = 'pmapp_ai_url';
  const getUrl = () => (localStorage.getItem(STORE_URL) || '').replace(/\/+$/, '');

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

  settingsBtn.addEventListener('click', () => {
    const show = settingsBox.style.display !== 'block';
    settingsBox.style.display = show ? 'block' : 'none';
    if (show) urlInput.value = getUrl();
  });
  urlSave.addEventListener('click', () => {
    const v = urlInput.value.trim();
    if (!v) { alert(t('ai_url_required') || '请输入 AI 后端地址'); return; }
    localStorage.setItem(STORE_URL, v);
    settingsBox.style.display = 'none';
    addMsg('bot', t('ai_url_saved') || '✅ 已设置 AI 后端，可以开始提问了。');
  });

  const history = []; // [{role, content}]
  async function send() {
    const text = inputEl.value.trim();
    if (!text) return;
    const url = getUrl();
    if (!url) {
      settingsBox.style.display = 'block';
      urlInput.focus();
      addMsg('bot', t('ai_url_missing') || '⚠️ 请先点右上角 ⚙️ 填入 AI 后端地址（部署后端后获得的 CloudStudio 链接）。');
      return;
    }
    inputEl.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    const typing = addMsg('bot', t('ai_thinking') || '智能海外助理 正在思考…');
    try {
      const resp = await fetch(url + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));
      const reply = data.reply || '(无回复)';
      typing.textContent = reply;
      history.push({ role: 'assistant', content: reply });
    } catch (e) {
      typing.textContent = (t('ai_call_fail') || '❌ 调用失败：') + e.message + '\n' + (t('ai_call_fail_hint') || '请确认后端地址正确且服务已在运行（CloudStudio 端口预览已开启）。');
    }
  }
  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // 首屏问候 + 地址提示（仅在消息区为空时初始化一次）
  if (messagesEl.children.length === 0) {
    addMsg('bot', t('ai_greeting') || '你好，有什么问题，都可以问我。');
    if (!getUrl()) {
      addMsg('bot', t('ai_url_missing') || '⚠️ 请先点右上角 ⚙️ 填入 AI 后端地址（部署后端后获得的 CloudStudio 链接）。');
    }
  }
}
