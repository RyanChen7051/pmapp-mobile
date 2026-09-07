/* ═══ Navigation & Utilities ═══ */
import { t, tr, applyTranslations } from './i18n.js';

// ── 页面切换引导语（首页/设定页不引导；其余 8 页各对应一条）──
/* 智能引导语 v2（2026-09-07）
 * 结构：icon（图标）/ color（主题色，卡片与图标底同色）/ t（主句：这栏是什么）/ s（副句：能干啥、为啥要在乎）
 * 主句副句均为中文源，经 DICT 反查输出 9 种语言。 */
const GUIDE_TEXTS = {
  factory:          { icon:'🏭', color:'#4E8AF5', t:'海外工厂档案',               s:'查地址、产线与对口人，要找哪个厂、找谁先看这里' },
  planning:         { icon:'📅', color:'#A06BFF', t:'项目与生产计划',             s:'建项目讯息，再排主计划与子计划，交期延误这里最先看到' },
  materials:        { icon:'📦', color:'#FF9F0A', t:'物料、治具与缺料预警',       s:'看齐套率、在途与库存，缺料会提前亮红灯，别等停线' },
  production:       { icon:'⚙️', color:'#FF6B6B', t:'现场提报的生产问题',         s:'每条可补 NG 数、不良率与处理方式，没补等于没记录' },
  engineering:      { icon:'🛠️', color:'#2DD4BF', t:'现场提报的工程问题',         s:'补上处理人与临时、永久对策，工程改了什么这里留痕' },
  factory_process:  { icon:'🔧', color:'#5E5CE6', t:'现场提报的制程问题',         s:'记录处理与永久对策，同一问题反复发生这里看得出来' },
  quality:          { icon:'✅', color:'#34C759', t:'品质问题与客户客诉',         s:'现场问题与客诉都能留言追踪，客诉没回红点会一直提醒' },
  inspection:       { icon:'🔁', color:'#FF4D8D', t:'来料不良 DOA 与客户退换 RMA', s:'登记、统计与跟进，不良率越高这里越要盯' },
  fieldlog:         { icon:'📍', color:'#FFC53D', t:'现场问题的唯一入口',         s:'选类别、拍照就能交，10 秒记录，自动分发到对应栏目' },
  reports:          { icon:'📊', color:'#3B82F6', t:'会议记录、周报、月报',       s:'选时间区段一键生成，要给领导看的东西从这里出' },
};

export function setupNavigation(App) {
  App.showApp = function() {
    // v3.16.0 全 App 极简：不再显示 nav bar / tab bar（按设计稿）
    // document.getElementById('tabbar').style.display = 'flex';
    // document.getElementById('topbar').style.display = 'flex';
    this.navigate('home');
  };

  App.navigate = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    // 桌面版侧栏：高亮当前页（手机版 tabbar 隐藏，无副作用）
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.tab[data-page="${page}"]`);
    if (tab) tab.classList.add('active');
    const titleKeys = { home: 'app_slogan', factory: 'tab_factory', planning: 'tab_planning', materials: 'tab_materials', production: 'tab_production', quality: 'tab_quality', engineering: 'tab_engineering', factory_process: 'tab_factory_process', inspection: 'tab_inspection', reports: 'tab_reports', fieldlog: 'tab_fieldlog', settings: 'tab_settings' };
    // v3.16.0 兼容：nav bar 隐藏后标题不再写
    // const tbTitle = document.getElementById('tb-title');
    // if (tbTitle) tbTitle.textContent = page === 'home' ? 'PMApp' : t(titleKeys[page] || 'app_slogan');
    // document.getElementById('tb-back').style.display = 'none';
    // document.getElementById('tb-action').innerHTML = '';
    const fab = document.getElementById('fab');
    if (fab) fab.style.display = 'none';
    // v3.16.1 悬浮「回首页」按钮：非首页时显示
    const homeFab = document.getElementById('home-fab');
    if (homeFab) homeFab.style.display = (page === 'home') ? 'none' : 'flex';
    // Re-apply translations for the active page's static elements
    applyTranslations();
    // 页面切换引导：首页与设定页不引导；同一页重复进入（如刷新/切语言）不重复触发
    // 又：每个栏目（按钮）的引导「本次登录内只显示一次」——登出或下次重新登录后才再显示一次。
    // 注意：引导优先于页面加载——若某页 loader 异常（如 reports 的 populateReportProjects 访问未就绪的 cache），
    // 也不能连引导一起吞掉。故先弹引导，再 try 包裹加载。
    if (GUIDE_TEXTS[page] && !this._hasShownGuide(page) && this._guideAllowed(page)) this.showGuide(page);
    this._lastGuidePage = page;
    // 加载页面内容（try 包裹，避免单页异常阻断整段导航逻辑）
    try {
      if (page === 'home') this.loadHome();
      else if (page === 'factory') { this.loadFactory(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
      else if (page === 'planning') this.loadPlanning();
      else if (page === 'materials') this.loadMaterials();
      else if (page === 'production') { this.loadProduction(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
      else if (page === 'quality') { this.qualModule = this.qualModule || 'issues'; this.loadQuality(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
      else if (page === 'engineering') this.loadEngineering();
      else if (page === 'factory_process') this.loadFactoryProcess();
      else if (page === 'inspection') this.loadInspection();
      else if (page === 'reports') this.loadReports();
      else if (page === 'fieldlog') { this.loadFieldLog(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) { fab.style.display = 'flex'; fab.setAttribute('onclick', 'App.showFieldLogEditor(null)'); } } }
      else if (page === 'settings') this.loadSettings();
    } catch (e) { console.error('[navigate] 加载页面失败:', page, e); }
    this.currentPage = page;
    this.currentModule = (page === 'production') ? 'projects' : (page === 'quality') ? ((this.qualModule === 'inspection') ? 'inspection' : 'issues') : (page === 'engineering') ? 'engineering' : (page === 'factory_process') ? 'factory_process' : null;
    window.scrollTo(0, 0);
  };

  /* ═══ AI 引导「本次登录内每个栏目只显示一次」═══
   * 已展示过的栏目记在 localStorage（pmapp_guides_shown），刷新页面不重复弹；
   * 登出 / 自动登出 / 下一次登录时调用 resetGuides() 清空 → 下次登录每个栏目再各弹一次。 */
  App._guideShownKey = 'pmapp_guides_shown';

  App._loadShownGuides = function() {
    try {
      const raw = localStorage.getItem(this._guideShownKey);
      this._shownGuides = new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { this._shownGuides = new Set(); }
  };

  App._hasShownGuide = function(page) {
    if (!this._shownGuides) this._loadShownGuides();
    return this._shownGuides.has(page);
  };

  App._markGuideShown = function(page) {
    if (!this._shownGuides) this._loadShownGuides();
    this._shownGuides.add(page);
    try { localStorage.setItem(this._guideShownKey, JSON.stringify([...this._shownGuides])); } catch (e) {}
  };

  // 重新登录 / 登出时重置：下次进入各栏目会再各显示一次引导
  App.resetGuides = function() {
    this._shownGuides = new Set();
    try { localStorage.removeItem(this._guideShownKey); } catch (e) {}
    this._lastGuidePage = null;
  };

  /* ── 引导偏好（2026-09-07）：熟练用户不必每次都看 ──
   * pmapp_guide_prefs = { all: false=全部关闭, off: {page:1}=单栏关闭, counts: {page:n}=累计看过几次 }
   * 同一栏目累计显示 GUIDE_MAX_VIEWS(3) 次后自动停止；也可在引导条上点「不再显示」提前关闭某一栏。 */
  App._guidePrefsKey = 'pmapp_guide_prefs';
  const GUIDE_MAX_VIEWS = 3;

  App._loadGuidePrefs = function() {
    try { this._guidePrefs = JSON.parse(localStorage.getItem(this._guidePrefsKey) || '{}'); } catch (e) { this._guidePrefs = {}; }
    if (!this._guidePrefs.off) this._guidePrefs.off = {};
    if (!this._guidePrefs.counts) this._guidePrefs.counts = {};
    return this._guidePrefs;
  };

  App._saveGuidePrefs = function() {
    try { localStorage.setItem(this._guidePrefsKey, JSON.stringify(this._guidePrefs || {})); } catch (e) {}
  };

  App._guideAllowed = function(page) {
    const p = this._guidePrefs || this._loadGuidePrefs();
    if (p.all === false) return false;
    if (p.off && p.off[page]) return false;
    if (p.counts && (p.counts[page] || 0) >= GUIDE_MAX_VIEWS) return false;
    return true;
  };

  // 引导条上「不再显示」：只关这一栏
  App.disableGuide = function(page) {
    const p = this._guidePrefs || this._loadGuidePrefs();
    p.off[page] = true;
    this._saveGuidePrefs();
    this.hideGuide();
    this.toast(tr('本栏引导已关闭'));
  };

  // 设定页总开关
  App.toggleAllGuides = function() {
    const p = this._guidePrefs || this._loadGuidePrefs();
    p.all = (p.all === false);
    this._saveGuidePrefs();
    this.renderGuideSettings();
    this.toast(tr(p.all ? '已开启' : '已关闭'));
  };

  // 一键恢复：清掉"全部关闭"与所有单栏关闭/计数
  App.restoreAllGuides = function() {
    this._guidePrefs = { all: true, off: {}, counts: {} };
    this._saveGuidePrefs();
    this.renderGuideSettings();
    this.toast(tr('引导已恢复'));
  };

  App.renderGuideSettings = function() {
    const p = this._guidePrefs || this._loadGuidePrefs();
    const el = document.getElementById('set-guide-all');
    if (!el) return;
    const on = p.all !== false;
    el.textContent = tr(on ? '已开启' : '已关闭');
    el.style.color = on ? 'var(--accent-green)' : 'var(--text-muted)';
  };

  // 悬浮 AI 引导员：顶部出现几秒后自动消失
  App.showGuide = function(page) {
    const g = GUIDE_TEXTS[page];
    if (!g) return;
    this._markGuideShown(page);
    // 累计看过几次，达到上限后本栏自动不再引导
    const prefs = this._guidePrefs || this._loadGuidePrefs();
    prefs.counts[page] = (prefs.counts[page] || 0) + 1;
    if (prefs.counts[page] >= GUIDE_MAX_VIEWS) prefs.off[page] = true;
    this._saveGuidePrefs();
    document.getElementById('ai-guide')?.remove();
    const el = document.createElement('div');
    el.id = 'ai-guide';
    el.className = 'ai-guide';
    el.style.setProperty('--g-color', g.color);
    el.innerHTML =
      '<span class="guide-badge">' + g.icon + '</span>' +
      '<div class="guide-body">' +
        '<div class="guide-top">' +
          '<span class="guide-kicker">AI ' + tr('智能引导') + '</span>' +
          '<span class="guide-close" onclick="App.hideGuide()">✕</span>' +
        '</div>' +
        '<div class="guide-title">' + tr(g.t) + '</div>' +
        '<div class="guide-text">' + tr(g.s) + '</div>' +
        '<div class="guide-foot"><span class="guide-never" onclick="App.disableGuide(\'' + page + '\')">' + tr('不再显示') + '</span></div>' +
      '</div>' +
      '<span class="guide-progress"></span>';
    document.body.appendChild(el);
    // 进入动画
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    // 手机：碰一下画面任意处即收起（不拦截这次点击，点按钮照样生效）；电脑：右上 ✕ 自行关闭
    // 8 秒只是兜底上限，不用干等。
    clearTimeout(this._guideTimer);
    this._guideTimer = setTimeout(() => this.hideGuide(), 8000);
    // 点在引导条内部（✕ / 不再显示）时不关闭，交给按钮自己处理；
    // 否则先关闭会让卡片 pointer-events:none，按钮的 click 再也收不到（手机上尤其明显）
    this._guideDismiss = (e) => {
      const box = document.getElementById('ai-guide');
      if (box && e && e.target && box.contains(e.target)) return;
      this.hideGuide();
    };
    document.addEventListener('touchstart', this._guideDismiss, { passive: true });
    document.addEventListener('mousedown', this._guideDismiss);
  };

  App.hideGuide = function() {
    const el = document.getElementById('ai-guide');
    if (this._guideDismiss) {
      document.removeEventListener('touchstart', this._guideDismiss);
      document.removeEventListener('mousedown', this._guideDismiss);
      this._guideDismiss = null;
    }
    if (!el) { clearTimeout(this._guideTimer); return; }
    clearTimeout(this._guideTimer);
    el.classList.remove('show');
    setTimeout(() => el.remove(), 320);
  };

  App.goBack = function() {
    if (this.pageStack.length > 0) {
      const prev = this.pageStack.pop();
      this.navigate(prev);
    }
  };

  // v3.16.1 一键回首页（清空 pageStack，避免「返回链」再次把用户带回深页）
  App.goHome = function() {
    this.pageStack = [];
    this.navigate('home');
  };

  App.pushPage = function(page) {
    this.pageStack.push(this.currentPage);
    this.navigate(page);
  };

  App.closeModal = function(e) {
    if (e && e.target.id !== 'modal-overlay') return;
    document.getElementById('modal-overlay').classList.remove('show');
    // v3.16.0 兼容：nav bar 隐藏后不再写 tb-action
    // document.getElementById('tb-action').innerHTML = '';
    if (this.currentPage === 'module-detail' && this.currentModule && this.isAdmin()) {
      const fn = this.currentModule === 'field_log' ? `App.showFieldLogEditor(${this.currentRecordId})` : `App.showEditFor('${this.currentModule}', ${this.currentRecordId})`;
      // 兼容旧逻辑
      // document.getElementById('tb-action').innerHTML = `<span onclick="${fn}">${t('btn_edit')}</span>`;
    } else if (this.currentPage === 'project-detail' && this.isAdmin()) {
      // 兼容旧逻辑
      // document.getElementById('tb-action').innerHTML = `<span onclick="App.showEditFor('projects', ${this.currentRecordId})">${t('btn_edit')}</span>`;
    }
    this._editingRecord = null;
  };
}

export function setupUtils(App) {
  App.esc = function(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  App.badgeClass = function(val) {
    const vl = String(val).toLowerCase();
    if (['closed', 'done', 'completed', 'shipped', 'active', 'enabled', 'inspected'].includes(vl)) return 'badge-green';
    if (['high', 'critical', 'urgent', 'open', 'cancelled'].includes(vl)) return 'badge-red';
    if (['medium', 'in_progress', 'preparing', 'assigned', 'analyzing', 'fixing', 'verifying'].includes(vl)) return 'badge-orange';
    if (['low', 'todo', 'planned', 'planning', 'packaged'].includes(vl)) return 'badge-gray';
    if (['on_hold', 'review'].includes(vl)) return 'badge-purple';
    return 'badge-blue';
  };

  App.toast = function(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  };

  App.setupPTR = function() {
    let startY = 0, pulling = false;
    const pages = ['home', 'factory', 'planning', 'materials', 'production', 'quality', 'engineering', 'factory_process', 'inspection', 'fieldlog', 'settings'];
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; }
    });
    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 60 && window.scrollY === 0) {
        for (const p of pages) {
          const ind = document.getElementById('ptr-' + p);
          if (ind && document.getElementById('page-' + p)?.classList.contains('active')) {
            ind.classList.add('show');
            ind.textContent = t('ptr_release');
            break;
          }
        }
      }
    });
    document.addEventListener('touchend', () => {
      if (!pulling) return;
      pulling = false;
      for (const p of pages) {
        const ind = document.getElementById('ptr-' + p);
        if (ind && ind.classList.contains('show')) {
          ind.textContent = t('t_syncing');
          this.loadAll().then(() => {
            this.navigate(this.currentPage);
            setTimeout(() => ind.classList.remove('show'), 500);
          });
          break;
        }
      }
    });
  };
}
