/* ═══ Home Page + Message Board ═══ */
import { STAGE_PROGRESS, MODULES, APP_VERSION } from './config.js';
import { t, tr } from './i18n.js';

/* ── 产业动态五大板块（顺序即展示顺序）──
   新数据带 sector 字段；旧数据无 sector 时按 category 映射，保证历史条目也能归类。 */
const NEWS_SECTORS = [
  { key: 'tws_earbuds',    icon: '🎧', name: '全球消费蓝牙耳机' },
  { key: 'hearing_aid',    icon: '🦻', name: '全球助听器/助听耳机' },
  { key: 'wireless_mic',   icon: '🎙️', name: '无线麦克风' },
  { key: 'audio_industry', icon: '🔊', name: '全球音频产业' },
  { key: 'smart_glasses',  icon: '👓', name: '全球智能眼镜' },
  { key: 'ai_industry',    icon: '🤖', name: '全球AI产业' },
  { key: 'iot',            icon: '🌐', name: '全球物联网IoT' },
];
// 每个板块每日 6 条（2026-09-06 由 5 改为 6）
const NEWS_PER_SECTOR = 6;
const SECTOR_BY_CATEGORY = {
  headphones: 'tws_earbuds', speakers: 'audio_industry', chips: 'audio_industry',
  microphone: 'wireless_mic', market: 'audio_industry', concept: 'audio_industry',
  big_brand: 'audio_industry', small_brand: 'audio_industry', hearing_aid: 'hearing_aid',
};
const sectorOf = n => (n && (n.sector || SECTOR_BY_CATEGORY[n.category])) || 'audio_industry';

/* ── World Clock ── */
const WC_CLOCKS = [
  { city: '中国', flag: '🇨🇳', tz: 'Asia/Shanghai',    accent: '#e94560' },
  { city: '越南', flag: '🇻🇳', tz: 'Asia/Ho_Chi_Minh', accent: '#2ed573' },
  { city: '印度', flag: '🇮🇳', tz: 'Asia/Kolkata',     accent: '#ffa502' },
];

function _tzOffsetMin(tz) {
  try {
    const now = new Date();
    const tzStr = now.toLocaleString('en-US', { timeZone: tz });
    const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
    return Math.round((new Date(tzStr) - new Date(utcStr)) / 60000);
  } catch { return 0; }
}

function _renderWorldClock() {
  const el = document.getElementById('world-clock');
  if (!el) return;
  const localOffset = -new Date().getTimezoneOffset();
  const now = new Date();

  el.innerHTML = WC_CLOCKS.map(c => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: c.tz, hour12: false,
      hour: '2-digit', minute: '2-digit',
    }).formatToParts(now);
    const get = type => parts.find(p => p.type === type)?.value || '00';
    const hh = get('hour'), mm = get('minute');
    return `<div class="wc"><span class="wc-flag">${c.flag}</span><b>${hh}:${mm}</b></div>`;
  }).join('');
}

let _wcTimer = null;
function _startWorldClock() {
  _renderWorldClock();
  if (_wcTimer) clearInterval(_wcTimer);
  _wcTimer = setInterval(_renderWorldClock, 1000);
}

export function setupHome(App) {
  App.loadHome = function() {
    _startWorldClock();
    const banner = document.getElementById('home-banner');
    if (!this.isLoggedIn()) {
      banner.innerHTML = `<div class="banner banner-warn">${t('not_logged_in')}</div>`;
    } else if (this.isViewer()) {
      banner.innerHTML = `<div class="banner banner-info">${t('ro_banner')}</div>`;
    } else if (this.isAdmin()) {
      banner.innerHTML = `<div class="banner banner-ok">${t('admin_banner')}</div>`;
    }

    // 物料预警：首页看板卡片 + 物料按钮角标（进首页就刷新，不用等进物料页）
    if (this.updateMatBadge) this.updateMatBadge();

    const projects = this.cache.projects || [];
    const today = new Date().toISOString().slice(0, 10);

    const projEl = document.getElementById('home-projects');
    if (projEl) {
      const activeProjects = projects.filter(p => p.status === 'active').slice(0, 5);
      if (activeProjects.length === 0) {
        projEl.innerHTML = `<div class="empty"><div class="empty-icon">📦</div>${t('empty_active')}</div>`;
      } else {
        projEl.innerHTML = activeProjects.map(p => {
          const progress = STAGE_PROGRESS[p.stage] || 0;
          const pColor = progress >= 75 ? 'var(--accent-green)' : progress >= 50 ? 'var(--accent-orange)' : 'var(--accent-blue)';
          return `<div class="card" onclick="App.openProjectDetail(${p.id})">
            <div class="card-title">📦 ${this.esc(p.name)}</div>
            <div class="card-meta">
              ${p.stage ? `<span class="badge badge-purple">${this.esc(p.stage)}</span>` : ''}
              ${p.customer_name_zh ? `<span>👤 ${this.esc(p.customer_name_zh)}</span>` : ''}
              ${p.delivery_date ? `<span>📅 ${this.esc(p.delivery_date)}</span>` : ''}
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;background:${pColor}"></div></div>
          </div>`;
        }).join('');
      }
    }

    const newsEl = document.getElementById('home-news');
    const allNews = this.cache.ai_industry_news || [];
    if (allNews.length === 0) {
      newsEl.innerHTML = `<div class="empty"><div class="empty-icon">📰</div>${t('empty_news')}</div>`;
    } else {
      // 按五大板块均衡展示（每板块取最新 2 条），避免某一品类一次性霸屏
      const card = n => `<div class="card" onclick="App.openDetail('ai_industry_news', ${n.id})">
        <div class="card-title">📰 ${this.esc(n.title)}</div>
        ${n.summary ? `<div style="font-size:12px;color:var(--text-secondary);margin:4px 0;line-height:1.5">${this.esc(n.summary.substring(0,80))}${n.summary.length>80?'...':''}</div>` : ''}
        <div class="card-meta">
          ${n.news_date ? `<span>📅 ${this.esc(n.news_date)}</span>` : ''}
          ${n.importance ? `<span class="badge ${this.badgeClass(n.importance)}">${this.esc(n.importance)}</span>` : ''}
          ${n.source ? `<span>📌 ${this.esc(n.source)}</span>` : ''}
          ${n.url ? `<a href="${this.esc(n.url)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent-blue);font-size:12px;text-decoration:none">${t('view_original')} ↗</a>` : ''}
        </div></div>`;
      let html = '';
      NEWS_SECTORS.forEach(sec => {
        const list = allNews.filter(n => sectorOf(n) === sec.key).slice(0, NEWS_PER_SECTOR);
        if (!list.length) return;
        html += `<div class="sector-group"><div class="sector-head"><span class="sector-icon">${sec.icon}</span><span class="sector-name">${tr(sec.name)}</span></div><div class="sector-grid">${list.map(card).join('')}</div></div>`;
      });
      newsEl.innerHTML = html || `<div class="empty"><div class="empty-icon">📰</div>${t('empty_news')}</div>`;
    }

    if (this.isLoggedIn()) {
      const nameEl = document.getElementById('msg-name');
      if (nameEl && !nameEl.value) nameEl.value = this.session.user.display_name || this.session.user.username || '';
    }
    this.renderMessages();

    const adminSection = document.getElementById('admin-login-section');
    if (adminSection) {
      if (this.isSuperAdmin()) {
        adminSection.style.display = '';
        this.loadLoginActivity();
      } else {
        adminSection.style.display = 'none';
      }
    }

    // 手机/电脑均渲染领导驾驶舱（响应式自适应）
    this.renderCockpit();
    this.renderQuickEntries();
    this.setupHomeCollapse();
  };

  /* ── 首页模块快捷宫格 ── */
  /* 首页模块快捷宫格：上排5个 设定·计划·物料·生产问题·工程问题；
   * 下排5个 工厂·现场·DOA·制程问题·品质问题。
   * 报告（会议记录/周报/月报）不占宫格，单列大按钮（见 #home-reports-block）。 */
  const QUICK_ENTRIES = [
    { page: 'settings',        icon: '⚙️', i18n: 'tab_settings',        label: '设定' },
    { page: 'planning',        icon: '📅',  i18n: 'tab_planning',        label: '项目计划' },
    { page: 'materials',       icon: '📦',  i18n: 'tab_materials',       label: '物料治具' },
    { page: 'production',      icon: '⚙️', i18n: 'tab_production',      label: '生产' },
    { page: 'engineering',     icon: '🛠️', i18n: 'tab_engineering',     label: '工程' },
    { page: 'factory',         icon: '🏭',  i18n: 'tab_factory',         label: '国际工厂' },
    { page: 'fieldlog',        icon: '📍',  i18n: null,                  label: '现场记录' },
    { page: 'inspection',      icon: '🔁',  i18n: null,                  label: 'DOA',  sub: '/RMA' },
    { page: 'factory_process', icon: '🔧',  i18n: 'tab_factory_process', label: '制程' },
    { page: 'quality',         icon: '✅',  i18n: 'tab_quality',         label: '品质' },
  ];

  App.renderQuickEntries = function() {
    const el = document.getElementById('home-quick');
    if (!el) return;
    el.innerHTML = `<div class="quick-grid">` + QUICK_ENTRIES.map(q => {
      let name = tr(q.label);
      if (q.i18n) { try { const v = t(q.i18n); if (v && v !== q.i18n) name = v; } catch {} }
      return `<div class="quick-item" onclick="App.navigate('${q.page}')">
        <span class="ic">${q.icon}</span><span>${name}${q.sub ? `<i class="q-sub">${q.sub}</i>` : ''}</span>
      </div>`;
    }).join('') + `</div>`;
  };

  /* ── 首页 AI 区块折叠（默认收起）── */
  App.setupHomeCollapse = function() {
    const head = document.getElementById('ai-head');
    const body = document.getElementById('ai-body');
    const chev = document.getElementById('ai-chev');
    if (!head || !body || head.dataset.bound === '1') return;
    head.dataset.bound = '1';
    head.addEventListener('click', (e) => {
      // 点齿轮不触发折叠
      if (e.target && e.target.id === 'ai-settings') return;
      const collapsed = body.classList.toggle('collapsed');
      if (chev) chev.style.transform = collapsed ? '' : 'rotate(180deg)';
    });
  };

  App.renderMessages = async function() {
    if (!this.cache.message_board) {
      this.cache.message_board = await this.fetchSyncData('message_board');
    }
    const messages = (this.cache.message_board || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const el = document.getElementById('msg-list');
    if (messages.length === 0) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">💬</div>${t('empty_messages')}</div>`;
      return;
    }
    el.innerHTML = messages.map(m => `<div class="msg-item">
      <div class="msg-head">
        <span class="msg-name">${this.esc(m.name || t('anonymous'))}</span>
        <span class="msg-time">${this.esc(m.created_at || '')}</span>
      </div>
      <div class="msg-content">${this.esc(m.content || '')}</div>
      <div class="msg-actions">
        <span class="msg-trans-btn" onclick="App.toggleTranslate(this, ${m.id})">${t('btn_translate')}</span>
        ${m.country ? `<span class="msg-country">🏳️ ${t('country_label')}${this.esc(m.country)}</span>` : ''}
        ${this.isAdmin() ? `<span class="msg-delete" onclick="App.deleteMessage(${m.id})">${t('btn_delete')}</span>` : ''}
      </div>
      <div class="msg-translation" id="trans-${m.id}" style="display:none"></div>
    </div>`).join('');
  };

  App.getClientCountry = async function() {
    if (this._clientCountry !== undefined) return this._clientCountry;
    const apis = [
      async () => { const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) }); const d = await r.json(); return (d && d.country) ? d.country : ''; },
      async () => { const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) }); const d = await r.json(); return (d && (d.country_name || d.country)) ? (d.country_name || d.country) : ''; },
    ];
    let result = '';
    for (const fn of apis) {
      try { result = await fn(); if (result) break; } catch (e) {}
    }
    this._clientCountry = result;
    return result;
  };

  App.postMessage = async function() {
    const nameEl = document.getElementById('msg-name');
    const contentEl = document.getElementById('msg-content');
    const name = nameEl.value.trim();
    const content = contentEl.value.trim();
    if (!name) { this.toast(t('ph_name')); return; }
    if (!content) { this.toast(t('ph_msg')); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id = Math.floor(Date.now() / 1000);
    try {
      const country = await this.getClientCountry();
      await this.sbPost('sync_data', {
        table_name: 'message_board', local_id: id,
        payload: JSON.stringify({ id, name, content, created_at: now, country }),
        supabase_id: this.uuid(),
        is_deleted: false, updated_at: new Date().toISOString(), device_id: this.deviceId,
      });
      contentEl.value = '';
      this.cache.message_board = await this.fetchSyncData('message_board');
      this.renderMessages();
      this.toast(t('t_msg_posted'));
    } catch (e) { this.toast(t('t_post_fail') + ' ' + e.message); }
  };

  App.deleteMessage = async function(id) {
    if (!confirm(t('confirm_del_msg'))) return;
    try {
      const records = await this.sbGet('sync_data', `table_name=eq.message_board&is_deleted=eq.false&select=supabase_id,payload`);
      const rec = records.find(r => { try { const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload; return p && p.id === id; } catch { return false; } });
      if (rec) {
        await this.sbPatch('sync_data', `supabase_id=eq.${rec.supabase_id}`, { is_deleted: true, updated_at: new Date().toISOString() });
      }
      this.cache.message_board = await this.fetchSyncData('message_board');
      this.renderMessages();
      this.toast(t('t_del_ok'));
    } catch (e) { this.toast(t('t_del_fail') + ' ' + e.message); }
  };
}
