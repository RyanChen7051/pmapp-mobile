/* ═══════════════════════════════════════════════════════════════
 * PMApp 外部协作端框架
 *   同一份源码，构建期注入 __VARIANT__ → 产出 FPWA（工厂端）/ CPWA（客户端）
 *   VARIANT = 'factory'  : 合作工厂使用，按 factory_id 隔离
 *   VARIANT = 'customer' : 客户使用，按 customer_project_no 隔离
 * ═══════════════════════════════════════════════════════════════ */
import { SUPABASE_URL, SUPABASE_KEY } from '../src/env.js';

const VARIANT = __VARIANT__;          // esbuild --define 注入
const IS_FACTORY = VARIANT === 'factory';
const IS_CUSTOMER = VARIANT === 'customer';

/* ─────────── 端配置 ─────────── */
const CFG = {
  factory: __VARIANT__ === 'factory' ? {
    code: 'FPWA', appName: 'PMApp Factory', appNameEn: 'PMApp Factory',
    theme: '#1e6b3a', themeDark: '#155230', accentBg: '#eaf5ec',
    tagline: '合作工厂协同平台', taglineEn: 'Partner Factory Portal',
    roleLabel: '选择工厂', roleLabelEn: 'Select Factory',
    idKey: 'factory_id', idLabel: '工厂', accessCode: 'fpwa2026',
    sessionKey: 'pmapp_fpwa_session', reportTable: 'fpwa_report',
    idSource: 'factory_info', idValueKey: 'id', idTextKey: 'factory_name',
    hideFields: [],                                    // 工厂可见全部项目字段
  } : undefined,
  customer: __VARIANT__ === 'customer' ? {
    code: 'CPWA', appName: 'PMApp 客户中心', appNameEn: 'PMApp Customer Portal',
    theme: '#0e5a8a', themeDark: '#0a4370', accentBg: '#e8f2f9',
    tagline: '客户项目协同平台', taglineEn: 'Customer Project Portal',
    roleLabel: '选择客户', roleLabelEn: 'Select Customer',
    idKey: 'customer_id', idLabel: '客户', accessCode: 'cpwa2026',
    sessionKey: 'pmapp_cpwa_session', reportTable: 'cpwa_feedback',
    // 客户身份取自「客户基础资料」(customer_info)，以 客户代码(code) 为唯一标识
    idSource: 'customer_info', idValueKey: 'code', idTextKey: 'customer_name',
    hideFields: ['factory_id', 'production_factory'],   // 客户不可见工厂信息
  } : undefined,
}[VARIANT];

const STAGE_PROGRESS = { NPI: 10, EVT: 25, DVT: 50, PVT: 75, MP: 100, completed: 100 };
const STAGES = ['NPI', 'EVT', 'DVT', 'PVT', 'MP'];

/* ─────────── 9 语言清单（与完整版 PWA 对齐）─────────── */
const LANGUAGES = {
  zh: { name: '中文', flag: '🇨🇳', rtl: false },
  en: { name: 'English', flag: '🇬🇧', rtl: false },
  es: { name: 'Español', flag: '🇪🇸', rtl: false },
  ja: { name: '日本語', flag: '🇯🇵', rtl: false },
  fr: { name: 'Français', flag: '🇫🇷', rtl: false },
  de: { name: 'Deutsch', flag: '🇩🇪', rtl: false },
  ar: { name: 'العربية', flag: '🇸🇦', rtl: true },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  hi: { name: 'हिन्दी', flag: '🇮🇳', rtl: false },
};

/* ─────────── i18n（中 / 英；后续可扩越南语等）─────────── */
const I18N = {
  zh: {
    login: '登录', selectRole: CFG.roleLabel, accessCode: '访问码', enter: '进入',
    custAccount: '客户账号', custCode: '客户代号', password: '密码', errLogin: '账号、代号或密码错误',
    myProjects: '我的项目', noProject: '暂无项目', loading: '加载中…',
    stage: '阶段', progress: '项目进度', custNo: '客户项目号', factoryNo: '工厂项目号',
    submit: '提交', cancel: '取消', remark: '备注', qty: '数量', date: '日期',
    reportTitle: IS_FACTORY ? '上报生产进度' : '提交反馈',
    myRecords: IS_FACTORY ? '我的上报记录' : '我的反馈记录',
    noRecord: '暂无记录', logout: '退出登录', settings: '设定', language: '语言',
    detail: '项目详情', submitted: '提交成功', errCode: '访问码错误',
    errNet: '网络异常，请重试', errSelect: '请先选择' + CFG.idLabel,
    allFields: '全部信息', refresh: '刷新', ok: '成功',
    problems: '问题记录', noProblem: '暂无相关问题记录', submitComplaint: '提交客诉',
    complaintCat: '问题类别', complaintProject: '关联项目', complaintDesc: '问题描述',
    commentPlaceholder: '写留言…', cmtTitle: '留言板', custComplaint: '客户投诉', intIssue: '内部问题',
  },
  en: {
    login: 'Sign In', selectRole: CFG.roleLabelEn, accessCode: 'Access Code', enter: 'Enter',
    custAccount: 'Customer Account', custCode: 'Customer Code', password: 'Password', errLogin: 'Invalid account, code or password',
    myProjects: 'My Projects', noProject: 'No projects yet', loading: 'Loading…',
    stage: 'Stage', progress: 'Progress', custNo: 'Customer Program', factoryNo: 'Factory P/N',
    submit: 'Submit', cancel: 'Cancel', remark: 'Remarks', qty: 'Quantity', date: 'Date',
    reportTitle: IS_FACTORY ? 'Report Production' : 'Submit Feedback',
    myRecords: IS_FACTORY ? 'My Reports' : 'My Feedback',
    noRecord: 'No records', logout: 'Sign Out', settings: 'Settings', language: 'Language',
    detail: 'Project Detail', submitted: 'Submitted', errCode: 'Invalid access code',
    errNet: 'Network error, please retry', errSelect: 'Please select ' + CFG.idLabel,
    allFields: 'Full Information', refresh: 'Refresh', ok: 'OK',
    problems: 'Issues', noProblem: 'No related issues', submitComplaint: 'Submit Complaint',
    complaintCat: 'Category', complaintProject: 'Project', complaintDesc: 'Description',
    commentPlaceholder: 'Write a comment…', cmtTitle: 'Comments', custComplaint: 'Customer Complaint', intIssue: 'Internal Issue',
  },
};
/* 其余 7 语言先以英文占位（与用户选择一致：中/英先译，其余待补译）*/
const __EN_DICT__ = I18N.en;
['es', 'ja', 'fr', 'de', 'ar', 'vi', 'hi'].forEach(l => { if (!I18N[l]) I18N[l] = __EN_DICT__; });
let LANG = localStorage.getItem(CFG.sessionKey + '_lang') || 'zh';
const T = k => (I18N[LANG] && I18N[LANG][k]) || k;

/* ─────────── Supabase 数据层（与现有 PWA 同构）─────────── */
const H = () => ({
  apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
});
const uuid = () => (crypto?.randomUUID
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));

async function sbGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query || ''}`, { headers: H() });
  if (!r.ok) throw new Error('GET ' + r.status);
  return r.json();
}
async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: { ...H(), Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('POST ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
}
async function sbPatch(table, query, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query || ''}`, {
    method: 'PATCH', headers: { ...H(), Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('PATCH ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
}

/** 读取某张业务表（sync_data 通用表），payload 兼容 JSON 字符串与 jsonb 对象 */
async function loadTable(tableName, limit = 1000) {
  const rows = await sbGet('sync_data',
    `select=supabase_id,table_name,payload,updated_at&table_name=eq.${encodeURIComponent(tableName)}&limit=${limit}`);
  return (rows || []).map(r => {
    let p = r.payload;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = {}; } }
    return { _sb: r.supabase_id, ...(p || {}) };
  }).filter(r => !r.is_deleted);
}

/** 写入一条外部上报/反馈记录 */
async function writeRecord(payload) {
  const now = new Date().toISOString();
  return sbPost('sync_data', {
    table_name: CFG.reportTable,
    payload: JSON.stringify({ ...payload, variant: VARIANT, created_at: now }),
    local_id: Date.now(),
    supabase_id: uuid(),
    is_deleted: false,
    updated_at: now,
    device_id: 'ext-' + VARIANT,
  });
}

/* ─────────── 会话 ─────────── */
function getSession() {
  try { return JSON.parse(localStorage.getItem(CFG.sessionKey) || 'null'); }
  catch { return null; }
}
function setSession(s) { localStorage.setItem(CFG.sessionKey, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(CFG.sessionKey); }

/* ─────────── 状态 ─────────── */
const S = { idents: [], projects: [], records: [], fieldlog: [], issues: [], current: null };

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toast(msg, bad) {
  const el = $('toast');
  el.textContent = msg;
  el.style.background = bad ? '#b8461f' : '#1e6b3a';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

/* ─────────── 数据加载 ─────────── */
async function loadIdents() {
  if (__VARIANT__ === 'factory') return loadTable('factory_info');
  if (CFG.idSource === 'customer_info') {
    const rows = await loadTable('customer_info');
    const seen = new Set(), out = [];
    rows.forEach(r => {
      const v = (r[CFG.idValueKey] || '').toString().trim();
      if (!v || seen.has(v)) return;
      seen.add(v);
      out.push({
        id: v,
        name: (r[CFG.idTextKey] || r.customer_name || v).toString().trim(),
        account: (r.account || '').toString().trim(),
        password: (r.password || '').toString(),
      });
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }
  const ps = await loadTable('project_info');
  const seen = new Set(), out = [];
  ps.forEach(p => {
    const v = (p[CFG.idValueKey] || '').toString().trim();
    if (v && !seen.has(v)) { seen.add(v); out.push({ id: v, name: v }); }
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function loadProjects() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('project_info');
  const v = String(sess.value).trim().toLowerCase();
  // 按客户过滤：兼容 customer_id / customer_project_no / 客户名称 多种关联写法
  return all.filter(p => {
    const cid = String(p[CFG.idKey] ?? '').trim().toLowerCase();
    const cno = String(p.customer_project_no ?? '').trim().toLowerCase();
    const cnm = String(p.customer_name_display ?? p.customer_name ?? '').trim().toLowerCase();
    return cid === v || cno === v || cnm.includes(v);
  });
}

async function loadRecords() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable(CFG.reportTable, 500);
  return all.filter(r => String(r.ident) === String(sess.value))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

/* ─────────── 渲染：登录页 ─────────── */
function loginLangGrid() {
  return `<div class="lang-block" style="margin-top:8px">
    <div class="lang-block-title">🌐 ${T('language')}</div>
    <div class="lang-grid">
      ${Object.entries(LANGUAGES).map(([k, o]) => `<button class="lang-chip ${LANG === k ? 'on' : ''}" data-l="${k}">${o.flag} ${o.name}</button>`).join('')}
    </div>
  </div>`;
}

function renderLogin() {
  const isC = IS_CUSTOMER;
  $('app').innerHTML = `
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">${CFG.code}</div>
        <div>
          <div class="brand-name">${LANG === 'zh' ? CFG.appName : CFG.appNameEn}</div>
          <div class="brand-sub">${LANG === 'zh' ? CFG.tagline : CFG.taglineEn}</div>
        </div>
      </div>
      ${isC ? `
      <label class="lbl">${T('custAccount')}</label>
      <input id="inp-account" class="inp" type="text" placeholder="${T('custAccount')}" autocomplete="off">
      <label class="lbl">${T('custCode')}</label>
      <input id="inp-code" class="inp" type="text" placeholder="${T('custCode')}" autocomplete="off">
      <label class="lbl">${T('password')}</label>
      <input id="inp-pass" class="inp" type="password" placeholder="${T('password')}" autocomplete="off">
      ` : `
      <label class="lbl">${T('selectRole')}</label>
      <select id="sel-ident" class="inp">
        <option value="">-- ${T('selectRole')} --</option>
        ${S.idents.map(o => `<option value="${esc(o.id)}">${esc(o.name || o.id)}</option>`).join('')}
      </select>
      <label class="lbl">${T('accessCode')}</label>
      <input id="inp-code" class="inp" type="password" placeholder="${T('accessCode')}" autocomplete="off">
      `}
      <button class="btn-main" id="btn-login">${T('enter')}</button>
      ${loginLangGrid()}
      <div class="hint">${CFG.code} · 外部协作端 · v0.1.0</div>
    </div>
  </div>`;
  document.querySelectorAll('#app [data-l]').forEach(b => {
    b.onclick = () => {
      LANG = b.dataset.l;
      localStorage.setItem(CFG.sessionKey + '_lang', LANG);
      renderLogin();
    };
  });
  $('btn-login').onclick = doLogin;
  if (isC) $('inp-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
  else $('inp-code').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
}

function doLogin() {
  if (IS_CUSTOMER) {
    const account = $('inp-account').value.trim();
    const code = $('inp-code').value.trim();
    const pass = $('inp-pass').value;
    if (!account || !code || !pass) return toast(T('errLogin'), true);
    const row = S.idents.find(o =>
      (o.account || '').toString().toLowerCase() === account.toLowerCase() &&
      (o.id || '').toString().toLowerCase() === code.toLowerCase() &&
      (o.password || '') === pass);
    if (!row) return toast(T('errLogin'), true);
    setSession({ value: row.id, name: row.name, account: row.account, at: Date.now() });
    return boot();
  }
  const sel = $('sel-ident'), code = $('inp-code').value.trim();
  if (!sel.value) return toast(T('errSelect'), true);
  if (code !== CFG.accessCode) return toast(T('errCode'), true);
  setSession({ value: sel.value, name: sel.options[sel.selectedIndex].text, at: Date.now() });
  boot();
}

/* ─────────── 渲染：主界面 ─────────── */
function renderShell() {
  const sess = getSession();
  $('app').innerHTML = `
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-badge">${CFG.code}</div>
      <div>
        <div class="tb-title">${esc(sess.name)}</div>
        <div class="tb-sub">${LANG === 'zh' ? CFG.tagline : CFG.taglineEn}</div>
      </div>
    </div>
    <div class="tb-right">
      <button class="tb-btn" id="btn-lang2" title="Language">🌐</button>
      <button class="tb-btn" id="btn-refresh" title="Refresh">↻</button>
      <button class="tb-btn" id="btn-out" title="Logout">⏻</button>
    </div>
  </header>
  <main id="main"></main>
  <nav class="tabbar">
    <button class="tab active" data-tab="projects">📦<span>${T('myProjects')}</span></button>
    ${IS_CUSTOMER ? `<button class="tab" data-tab="problems">🐞<span>${T('problems')}</span></button>` : `<button class="tab" data-tab="records">📝<span>${T('myRecords')}</span></button>`}
    <button class="tab" data-tab="settings">⚙️<span>${T('settings')}</span></button>
  </nav>
  <div id="modal" class="modal"></div>`;

  $('btn-out').onclick = () => { clearSession(); S.current = null; boot(); };
  $('btn-refresh').onclick = () => refreshData();
  $('btn-lang2').onclick = () => {
    LANG = LANG === 'zh' ? 'en' : 'zh';
    localStorage.setItem(CFG.sessionKey + '_lang', LANG);
    renderShell(); switchTab(S.tab || 'projects');
  };
  document.querySelectorAll('.tab').forEach(b => {
    b.onclick = () => switchTab(b.dataset.tab);
  });
  switchTab('projects');
}

function switchTab(tab) {
  S.tab = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab !== 'problems') { const f = $('complaint-fab'); if (f) f.remove(); }
  if (tab === 'projects') renderProjects();
  else if (tab === 'problems') renderProblems();
  else if (tab === 'records') renderRecords();
  else renderSettings();
}

function projCard(p) {
  const stage = (p.project_stage || '').toUpperCase();
  const pct = STAGE_PROGRESS[stage] ?? 5;
  const idx = STAGES.indexOf(stage);
  return `
  <div class="card" data-id="${esc(p.id)}">
    <div class="card-head">
      <div class="card-title">${esc(p.factory_project_no || p.customer_project_no || '—')}</div>
      <span class="stage-badge">${esc(stage || '—')}</span>
    </div>
    <div class="card-meta">
      ${p.customer_project_no && !CFG.hideFields.includes('customer_project_no')
        ? `<div><span>${T('custNo')}</span>${esc(p.customer_project_no)}</div>` : ''}
      ${!CFG.hideFields.includes('production_factory')
        ? `<div><span>${T('factoryNo')}</span>${esc(p.production_factory || '—')}</div>` : ''}
    </div>
    <div class="pbar"><div class="pbar-in" style="width:${pct}%"></div></div>
    <div class="pbar-txt">${T('progress')} ${pct}% · ${idx >= 0 ? (idx + 1) + '/' + STAGES.length : '—'}</div>
  </div>`;
}

function renderProjects() {
  const m = $('main');
  if (!S.projects.length) {
    m.innerHTML = `<div class="empty"><div class="empty-ico">📦</div><div>${T('noProject')}</div>
      <button class="btn-ghost" id="btn-reload">${T('refresh')}</button></div>`;
    const b = $('btn-reload'); if (b) b.onclick = refreshData;
    return;
  }
  m.innerHTML = `<div class="list">${S.projects.map(projCard).join('')}</div>`;
  document.querySelectorAll('.card').forEach(c => {
    c.onclick = () => {
      const p = S.projects.find(x => String(x.id) === String(c.dataset.id));
      if (p) openDetail(p);
    };
  });
}

function openDetail(p) {
  const skip = new Set(['id', 'is_deleted', '_sb', 'supabase_id', 'synced_at', 'created_at', 'updated_at']);
  const rows = Object.entries(p)
    .filter(([k, v]) => !skip.has(k) && !CFG.hideFields.includes(k) && v !== '' && v != null)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  const stage = (p.project_stage || '').toUpperCase();
  const pct = STAGE_PROGRESS[stage] ?? 5;

  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div>
        <div class="sheet-title">${esc(p.factory_project_no || p.customer_project_no || '—')}</div>
        <div class="sheet-sub">${T('detail')} · ${esc(stage || '—')}</div>
      </div>
      <button class="sheet-x" id="m-x">✕</button>
    </div>
    <div class="pbar big"><div class="pbar-in" style="width:${pct}%"></div></div>
    <div class="kv-list">${rows || '<div class="empty-sm">—</div>'}</div>
    <button class="btn-main" id="m-report">${T('reportTitle')}</button>
    <div class="spacer"></div>
  </div>`;
  $('modal').classList.add('open');
  $('m-x').onclick = closeModal;
  $('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
  $('m-report').onclick = () => { if (IS_CUSTOMER) openComplaintForm(p); else openReport(p); };
}

function closeModal() { $('modal').classList.remove('open'); $('modal').innerHTML = ''; }

function openReport(p) {
  const today = new Date().toISOString().slice(0, 10);
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div><div class="sheet-title">${T('reportTitle')}</div>
      <div class="sheet-sub">${esc(p.factory_project_no || p.customer_project_no || '')}</div></div>
      <button class="sheet-x" id="m-x2">✕</button>
    </div>
    <label class="lbl">${T('date')}</label>
    <input id="f-date" class="inp" type="date" value="${today}">
    ${IS_FACTORY ? `<label class="lbl">${T('qty')}</label>
    <input id="f-qty" class="inp" type="number" placeholder="0">` : ''}
    <label class="lbl">${T('remark')}</label>
    <textarea id="f-note" class="inp" rows="4" placeholder="${T('remark')}"></textarea>
    <button class="btn-main" id="f-send">${T('submit')}</button>
    <button class="btn-ghost" id="f-cancel">${T('cancel')}</button>
    <div class="spacer"></div>
  </div>`;
  $('m-x2').onclick = closeModal;
  $('f-cancel').onclick = closeModal;
  $('f-send').onclick = async () => {
    const btn = $('f-send'); btn.disabled = true; btn.textContent = '…';
    try {
      await writeRecord({
        ident: String(getSession().value),
        project: String(p.factory_project_no || p.customer_project_no || ''),
        customer_no: String(p.customer_project_no || ''),
        date: $('f-date').value,
        qty: IS_FACTORY ? Number($('f-qty')?.value || 0) : null,
        note: $('f-note').value,
      });
      closeModal(); toast(T('submitted'));
      await refreshData(); switchTab('records');
    } catch (e) {
      btn.disabled = false; btn.textContent = T('submit'); toast(T('errNet'), true);
    }
  };
}

function renderRecords() {
  const m = $('main');
  if (!S.records.length) {
    m.innerHTML = `<div class="empty"><div class="empty-ico">📝</div><div>${T('noRecord')}</div></div>`;
    return;
  }
  m.innerHTML = `<div class="list">${S.records.map(r => `
    <div class="card flat">
      <div class="card-head">
        <div class="card-title">${esc(r.project || '—')}</div>
        <span class="date-badge">${esc((r.date || (r.created_at || '').slice(0, 10)) || '')}</span>
      </div>
      ${r.qty ? `<div class="card-meta"><div><span>${T('qty')}</span>${esc(r.qty)}</div></div>` : ''}
      ${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}
    </div>`).join('')}</div>`;
}

function renderSettings() {
  $('main').innerHTML = `
  <div class="list">
    <div class="card flat">
      <div class="card-head"><div class="card-title">${CFG.code} v0.1.0</div></div>
      <div class="card-meta">
        <div><span>Variant</span>${VARIANT}</div>
        <div><span>${CFG.idLabel}</span>${esc(getSession().name)}</div>
        <div><span>${T('myProjects')}</span>${S.projects.length}</div>
        <div><span>${T('myRecords')}</span>${S.records.length}</div>
      </div>
    </div>
    <div class="card flat">
      <div class="lang-block">
        <div class="lang-block-title">🌐 ${T('language')}</div>
        <div class="lang-grid">
          ${Object.entries(LANGUAGES).map(([k, o]) => `<button class="lang-chip ${LANG === k ? 'on' : ''}" data-l="${k}">${o.flag} ${o.name}</button>`).join('')}
        </div>
      </div>
    </div>
    <button class="btn-main danger" id="btn-out2">${T('logout')}</button>
  </div>`;
  document.querySelectorAll('[data-l]').forEach(b => {
    b.onclick = () => {
      LANG = b.dataset.l;
      localStorage.setItem(CFG.sessionKey + '_lang', LANG);
      renderShell(); switchTab('settings');
    };
  });
  $('btn-out2').onclick = () => { clearSession(); boot(); };
}

/* ─────────── CPWA：问题记录（只读）+ 留言板 + 客诉提交 ─────────── */
// 说明：CPWA 是 FPWA 子系统。客户登录后可见其项目相关的全部 field_log 问题（只读），
// 每条问题下方有留言板供客户与内部团队沟通；客户亦可通过「提交客诉」把现场记录
// 作为客户投诉写入 field_log（is_customer_complaint=true），自动归类到 生产/工程/制程/品质，
// 并汇总进 PWA 首页「每周新增客户投诉」「待处理问题」看板。

function cmtFmt(iso) {
  if (!iso) return '';
  try { const d = new Date(iso); if (isNaN(d.getTime())) return String(iso).slice(5, 16);
    const p = n => String(n).padStart(2, '0');
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  } catch (e) { return String(iso).slice(5, 16); }
}

// 兼容 comments 在 Supabase 中以 JSON 字符串 '[]' 存储（payload 序列化后），统一转回数组
function asCmtArr(c) {
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') { try { const a = JSON.parse(c); if (Array.isArray(a)) return a; } catch (e) {} }
  return [];
}

// 读取客户可见的 field_log：自己提交的客诉(customer_code) + 其项目相关的全部问题
async function loadFieldLog() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('field_log', 2000);
  const v = String(sess.value).trim().toLowerCase();
  const projSet = new Set((S.projects || []).map(p =>
    [p.name, p.factory_project_no, p.customer_project_no, p.id]
      .map(x => String(x || '').trim()).filter(Boolean)).flat());
  return all.filter(r => {
    if (String(r.customer_code || '').trim().toLowerCase() === v) return true;
    return projSet.has(String(r.project || '').trim());
  }).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(r => ({ ...r, _kind: 'field_log' }));
}

// 写/更新一条 field_log（客诉或留言均走此）
async function saveFieldLogRecord(r) {
  const now = new Date().toISOString();
  let sbId = r._sb;
  const payload = JSON.stringify(r);
  if (sbId) {
    await sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: now, device_id: 'ext-customer' });
  } else {
    sbId = uuid();
    await sbPost('sync_data', { table_name: 'field_log', local_id: Date.now(), payload, supabase_id: sbId, is_deleted: false, updated_at: now, device_id: 'ext-customer' });
    r._sb = sbId;
  }
}

// 读取客户可见的 issues（内部问题）：通过 project_id 映射项目讯息(project_info.id)
async function loadIssues() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('issues', 2000);
  const projIds = new Set((S.projects || []).map(p => String(p.id)).filter(Boolean));
  return all.filter(r => projIds.has(String(r.project_id)))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(r => ({ ...r, _kind: 'issues' }));
}

function projRefById(id) {
  const p = (S.projects || []).find(x => String(x.id) === String(id));
  if (!p) return '';
  return p.factory_project_no || p.customer_project_no || p.name || String(id);
}

async function saveIssueRecord(r) {
  const now = new Date().toISOString();
  let sbId = r._sb;
  const payload = JSON.stringify(r);
  if (sbId) {
    await sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: now, device_id: 'ext-customer' });
  } else {
    sbId = uuid();
    await sbPost('sync_data', { table_name: 'issues', local_id: Date.now(), payload, supabase_id: sbId, is_deleted: false, updated_at: now, device_id: 'ext-customer' });
    r._sb = sbId;
  }
}

function problemCard(r) {
  const isC = r.is_customer_complaint;
  return `<div class="card" data-id="${esc(r.id)}">
    <div class="card-head">
      <div class="card-title">📸 ${esc(r.project || '—')}</div>
      ${isC ? `<span class="badge" style="background:#378ADD;color:#fff">${T('custComplaint')}</span>` : ''}
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${esc(r.status)}</span>` : ''}
    </div>
    <div class="card-meta">
      ${r.problem_category ? `<span>类:${esc(r.problem_category)}</span>` : ''}
      ${isC && r.customer_code ? `<span>🗣️ ${esc(r.customer_code)}</span>` : ''}
      <span>🕒 ${esc((r.created_at || '').slice(0, 16))}</span>
    </div>
    ${r.description ? `<div class="card-desc">${esc((r.description || '').slice(0, 120))}</div>` : ''}
  </div>`;
}

function issueCard(r) {
  const proj = projRefById(r.project_id);
  const sev = r.severity || 'medium';
  return `<div class="card" data-id="${esc(r.id)}">
    <div class="card-head">
      <div class="card-title">🛠 ${esc(proj || '—')}</div>
      <span class="badge" style="background:#7a4fb5;color:#fff">${T('intIssue')}</span>
      ${r.status ? `<span class="badge ${r.status === 'closed' || r.status === '已解决' || r.status === 'resolved' ? 'badge-green' : (r.status === '处理中' || r.status === 'in_progress' || r.status === 'open') ? 'badge-orange' : 'badge-red'}">${esc(r.status)}</span>` : ''}
    </div>
    <div class="card-meta">
      ${r.title ? `<span>题:${esc(r.title)}</span>` : ''}
      ${r.severity ? `<span>级:${esc(sev)}</span>` : ''}
      ${r.issue_type ? `<span>类:${esc(r.issue_type)}</span>` : ''}
      <span>🕒 ${esc((r.created_at || '').slice(0, 16))}</span>
    </div>
    ${r.description ? `<div class="card-desc">${esc((r.description || '').slice(0, 120))}</div>` : ''}
  </div>`;
}

function problemCommentsHtml(r) {
  const cmts = asCmtArr(r.comments);
  return `<div class="cmt-box">
    <div class="cmt-title">💬 ${T('cmtTitle')}</div>
    ${cmts.length ? cmts.map(c => `<div class="cmt">
      <div class="cmt-top"><span class="cmt-u">${esc(c.u || '?')}</span>${c.country ? `<span class="cmt-c">🏳️ ${esc(c.country)}</span>` : ''}<span class="cmt-t">${esc(cmtFmt(c.t))}</span></div>
      <div class="cmt-m">${esc(c.m || '')}</div></div>`).join('') : '<div class="empty-sm">—</div>'}
    <div class="cmt-row"><input type="text" id="cmt-${esc(r.id)}" maxlength="500" placeholder="${T('commentPlaceholder')}" onkeydown="if(event.key==='Enter')cpwaAddComment('${esc(r.id)}')">
      <button type="button" class="btn btn-primary" style="width:auto;padding:8px 14px;font-size:13px" onclick="cpwaAddComment('${esc(r.id)}')">${T('submit')}</button></div>
  </div>`;
}

async function cpwaAddComment(id) {
  const r = findProblem(id);
  const inp = $('cmt-' + id);
  if (!r || !inp) return;
  const m = inp.value.trim();
  if (!m) return toast(T('commentPlaceholder'));
  const sess = getSession();
  r.comments = asCmtArr(r.comments);
  r.comments.push({ u: sess ? sess.name : '?', m, t: new Date().toISOString() });
  try {
    if (r._kind === 'issues') await saveIssueRecord(r);
    else await saveFieldLogRecord(r);
    toast(T('submitted')); openProblem(r);
  } catch (e) { toast(T('errNet'), true); }
}
// 留言发送由 inline onclick 字符串调用，esbuild 会改名顶层函数名；
// 显式挂到 window，保证 onclick="cpwaAddComment('id')" 在运行时能命中。
window.cpwaAddComment = cpwaAddComment;

function findProblem(id) {
  return (S.fieldlog || []).find(x => String(x.id) === String(id))
      || (S.issues || []).find(x => String(x.id) === String(id));
}

function renderProblems() {
  const m = $('main');
  const list = [...(S.fieldlog || []), ...(S.issues || [])]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  if (!list.length) {
    m.innerHTML = `<div class="empty"><div class="empty-ico">🐞</div><div>${T('noProblem')}</div>
      <button class="btn-ghost" id="btn-reload2">${T('refresh')}</button></div>`;
    const b = $('btn-reload2'); if (b) b.onclick = refreshData;
    renderComplaintFab(); return;
  }
  m.innerHTML = `<div class="list">${list.map(r => r._kind === 'issues' ? issueCard(r) : problemCard(r)).join('')}</div>`;
  document.querySelectorAll('.card').forEach(c => {
    c.onclick = () => {
      const r = findProblem(c.dataset.id);
      if (r) openProblem(r);
    };
  });
  renderComplaintFab();
}

// 只读详情：展示完整字段 + 留言板（客户可在下方留言，但不可改记录字段）
function openProblem(r) {
  const skip = new Set(['id', '_sb', 'is_deleted', 'created_at', 'updated_at', 'comments']);
  const rows = Object.entries(r)
    .filter(([k, v]) => !skip.has(k) && v !== '' && v != null)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${esc(r.project || projRefById(r.project_id) || '—')}</div>
      <div class="sheet-sub">${r.is_customer_complaint ? T('custComplaint') : (r._kind === 'issues' ? T('intIssue') : T('problems'))} · ${esc(r.status || '')}</div></div>
      <button class="sheet-x" id="m-xo">✕</button></div>
    <div class="kv-list">${rows || '<div class="empty-sm">—</div>'}</div>
    ${problemCommentsHtml(r)}
    <div class="spacer"></div>
  </div>`;
  $('m-xo').onclick = closeModal;
  $('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
}

function renderComplaintFab() {
  let fab = $('complaint-fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'complaint-fab';
    fab.className = 'fab';
    fab.textContent = '＋';
    fab.title = T('submitComplaint');
    fab.onclick = () => openComplaintForm(null);
    $('app').appendChild(fab);
  }
}

// 客诉/现场记录提交表单：客户自选 生产/工程/制程/品质 类别
function openComplaintForm(p) {
  const projOpts = `<option value="">（未选）</option>` + (S.projects || []).map(pr => {
    const val = pr.factory_project_no || pr.customer_project_no || pr.name || pr.id || '';
    return `<option value="${esc(val)}">${esc(val)}</option>`;
  }).join('');
  const sess = getSession();
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${T('submitComplaint')}</div>
      <div class="sheet-sub">${T('custComplaint')} · CPWA</div></div>
      <button class="sheet-x" id="m-xc">✕</button></div>
    <label class="lbl">${T('complaintProject')}</label>
    <select id="cf-project" class="inp">${projOpts}</select>
    <label class="lbl">${T('complaintCat')}</label>
    <select id="cf-cat" class="inp">
      <option value="生产">生产</option><option value="工程">工程</option>
      <option value="制程">制程</option><option value="品质">品质</option>
    </select>
    <label class="lbl">${T('complaintDesc')}</label>
    <textarea id="cf-desc" class="inp" rows="5" placeholder="请描述您遇到的问题…"></textarea>
    <button class="btn-main" id="cf-send">${T('submit')}</button>
    <button class="btn-ghost" id="cf-cancel">${T('cancel')}</button>
    <div class="spacer"></div>
  </div>`;
  if (p) { const pe = $('cf-project'); if (pe) pe.value = (p.factory_project_no || p.customer_project_no || ''); }
  $('m-xc').onclick = closeModal;
  $('cf-cancel').onclick = closeModal;
  $('cf-send').onclick = async () => {
    const btn = $('cf-send'); btn.disabled = true; btn.textContent = '…';
    const rec = {
      id: 'cf_' + Date.now(),
      project: $('cf-project').value.trim(),
      problem_category: $('cf-cat').value,
      description: $('cf-desc').value.trim(),
      status: '待处理',
      is_customer_complaint: true,
      customer_code: sess ? sess.value : '',
      customer_name: sess ? sess.name : '',
      reporter: sess ? sess.name : '客户',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      comments: [],
    };
    if (!rec.description) { btn.disabled = false; btn.textContent = T('submit'); return toast(T('complaintDesc'), true); }
    if (!rec.project) { btn.disabled = false; btn.textContent = T('submit'); return toast(T('complaintProject'), true); }
    try {
      await saveFieldLogRecord(rec);
      closeModal(); toast(T('submitted'));
      await refreshData(); switchTab('problems');
    } catch (e) { btn.disabled = false; btn.textContent = T('submit'); toast(T('errNet'), true); }
  };
}

/* ─────────── 数据刷新 ─────────── */
async function refreshData() {
  try {
    S.projects = await loadProjects();
    S.records = await loadRecords();
    if (IS_CUSTOMER) { S.fieldlog = await loadFieldLog(); S.issues = await loadIssues(); }
    if (S.tab === 'projects') renderProjects();
    else if (S.tab === 'problems') renderProblems();
    else if (S.tab === 'records') renderRecords();
    else if (S.tab === 'settings') renderSettings();
  } catch (e) { toast(T('errNet'), true); }
}

/* ─────────── 启动 ─────────── */
async function boot() {
  const sess = getSession();
  if (!sess) {
    if (!S.idents.length) {
      $('app').innerHTML = `<div class="empty"><div class="empty-ico">⏳</div><div>${T('loading')}</div></div>`;
      try { S.idents = await loadIdents(); }
      catch { S.idents = []; toast(T('errNet'), true); }
    }
    return renderLogin();
  }
  renderShell();
  $('main').innerHTML = `<div class="empty"><div class="empty-ico">⏳</div><div>${T('loading')}</div></div>`;
  await refreshData();
}

boot();
