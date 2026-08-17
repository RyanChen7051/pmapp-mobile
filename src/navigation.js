/* ═══ Navigation & Utilities ═══ */
import { t, applyTranslations } from './i18n.js';

// ── 页面切换引导语（首页/设定页不引导；其余 8 页各对应一条）──
const GUIDE_TEXTS = {
  factory:   '在这里你可以快速检视到工厂的直接讯息，包含工厂名称、地址、功能、直接应对人员等。',
  planning:  '在这里可以知道各项理论计划，包含订单讯息、交付计划、及生产计划等，同时也可以了解延误状态。',
  materials: '在这里你可以看到物料的各种状态，包含物料运输状态、协力厂物料库存及风险预警。',
  production:'在这里你可以看到每个计划的实际执行状态，与计划功能有所区别。',
  quality:   '在这里你可以看到各项品质问题，包含各种来料的名称、问题点、问题点类别、问题对应负责人、解决状态等讯息。',
  engineering:'在这里你可以看到各项工程问题，以及现场提报并归类为「工程」的现场问题。',
  factory_process:'在这里你可以看到各项 制程问题，以及现场提报并归类为「制程」的现场问题。',
  inspection:'在这里你可以看到包含物料来料问题的资料及各类详细讯息统计、产品使用后问题反馈等各类资料。',
  fieldlog:  '这边是给直接人员做问题记录的界面，可直接做问题名称、叙述及问题拍照等等快速功能界面。',
  reports:   '在这里可以快速了解区段时间内的各项海外协力厂生产及交付状态，其中周报的时间区段为7天，月报为30天，可直接点选需求范围的起始时间后生成报告。',
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
    // 注意：引导优先于页面加载——若某页 loader 异常（如 reports 的 populateReportProjects 访问未就绪的 cache），
    // 也不能连引导一起吞掉。故先弹引导，再 try 包裹加载。
    if (GUIDE_TEXTS[page] && page !== this._lastGuidePage) this.showGuide(page);
    this._lastGuidePage = page;
    // 加载页面内容（try 包裹，避免单页异常阻断整段导航逻辑）
    try {
      if (page === 'home') this.loadHome();
      else if (page === 'factory') { this.loadFactory(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
      else if (page === 'planning') this.loadPlanning();
      else if (page === 'materials') this.loadMaterials();
      else if (page === 'production') { this.loadProduction(); if (this.isAdmin()) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
      else if (page === 'quality') { this.qualModule = this.qualModule || 'issues'; this.loadQuality(); if (this.canEdit(this.qualModule || 'issues')) { const fab = document.getElementById('fab'); if (fab) fab.style.display = 'flex'; } }
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

  // 悬浮 AI 引导员：顶部出现几秒后自动消失
  App.showGuide = function(page) {
    const text = GUIDE_TEXTS[page];
    if (!text) return;
    document.getElementById('ai-guide')?.remove();
    const el = document.createElement('div');
    el.id = 'ai-guide';
    el.className = 'ai-guide';
    el.innerHTML =
      '<img class="guide-avatar" src="ai-avatar.jpg" alt="智能海外助理" />' +
      '<div class="guide-body">' +
        '<div class="guide-title">智能引导 · AI Guide</div>' +
        '<div class="guide-text">' + text + '</div>' +
      '</div>' +
      '<div class="guide-close" onclick="document.getElementById(\'ai-guide\')?.remove()">✕</div>';
    document.body.appendChild(el);
    // 触发进入动画
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    // 停留 1.5 秒后自动消失（仅显示当前页这一条引导语，不会多页同屏）
    clearTimeout(this._guideTimer);
    this._guideTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 1500);
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
    if (this.currentPage === 'module-detail' && this.currentModule && this.canEdit(this.currentModule)) {
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
    const pages = ['home', 'factory', 'planning', 'materials', 'production', 'quality', 'engineering', 'factory_process', 'inspection', 'settings'];
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
