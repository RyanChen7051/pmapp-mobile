/* ═══ AI 助理浮窗（小P）═══
 * 独立于 App，仅用 DOM + fetch + localStorage。
 * 后端地址存 localStorage('pmapp_ai_url')，首次打开浮窗引导设置。
 */
import { t } from './i18n.js';

export function initAIAssistant() {
  const fab = document.getElementById('ai-fab');
  const panel = document.getElementById('ai-panel');
  const closeBtn = document.getElementById('ai-close');
  const messagesEl = document.getElementById('ai-messages');
  const inputEl = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const settingsBtn = document.getElementById('ai-settings');
  const settingsBox = document.getElementById('ai-settings-box');
  const urlInput = document.getElementById('ai-url-input');
  const urlSave = document.getElementById('ai-url-save');
  if (!fab || !panel) return;

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

  function openPanel() {
    panel.classList.add('open');
    if (!getUrl()) { settingsBox.style.display = 'block'; urlInput.focus(); }
  }
  fab.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

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
      addMsg('bot', t('ai_url_missing') || '⚠️ 请先在设置中填入 AI 后端地址（部署后端后获得的 CloudStudio 链接）。');
      return;
    }
    inputEl.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    const typing = addMsg('bot', t('ai_thinking') || '小P 正在思考…');
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

  addMsg('bot', t('ai_greeting') || '你好，有什么问题，都可以问我。');
}
