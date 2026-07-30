/* ═══════════════════════════════════════════════════
   PMApp Mobile v3.5.0 — Modular Entry Point with i18n + Translate
   Assembles all modules into the global App object
   ═══════════════════════════════════════════════════ */
import { APP_VERSION } from './config.js';
import { t, getLang, setLang, initLang, applyTranslations, LANGUAGES } from './i18n.js';
import { setupSupabaseClient } from './supabase-client.js';
import { setupAuth } from './auth.js';
import { setupData } from './data.js';
import { setupHome } from './home.js';
import { setupPages } from './pages.js';
import { setupDetail } from './detail.js';
import { setupEdit } from './edit.js';
import { setupReports } from './reports.js';
import { setupNavigation, setupUtils } from './navigation.js';
import { setupTranslate, clearTranslateCache } from './translate.js';
import { setupSyncQueue } from './sync.js';
import { initAIAssistant } from './ai.js';
import { setupCockpit } from './cockpit.js';
import { setupCharts } from './charts.js';
import { setupFieldLog } from './fieldlog.js';

const App = {
  session: null,
  currentPage: 'home',
  pageStack: [],
  cache: {},
  deviceId: '',
  currentModule: null,
  currentRecordId: null,
  prodFilter: 'all',
  qualFilter: 'all',
  _editingRecord: null,
  _editingIsCreate: false,
  _editingModule: null,
  // i18n
  t, getLang, setLang, LANGUAGES,
  // Translate
  clearTranslateCache,

  init() {
    initLang();
    applyTranslations();
    this.deviceId = localStorage.getItem('pmapp_device_id') || this.generateDeviceId();
    const saved = localStorage.getItem('pmapp_session');
    if (saved) {
      try {
        this.session = JSON.parse(saved);
        // 仅当「登录当天（中国日期）」才恢复会话；跨天则视为失效，要求重新登录
        if (!this.isSessionValidToday()) {
          localStorage.removeItem('pmapp_session');
          this.session = null;
        }
      } catch (e) { localStorage.removeItem('pmapp_session'); }
    }
    if ('serviceWorker' in navigator) {
      this.initServiceWorker();
    }
    this.showApp();
    this.loadAll();
    this.setupPTR();
    this.setupSessionGuard();
    // 宽屏（领导电脑端）自适应：初次判定 + 监听断点变化
    window.matchMedia('(min-width: 860px)').addEventListener('change', () => this.applyLayout());
    this.applyLayout();
    // Re-apply translations after dynamic content loads
    setTimeout(() => applyTranslations(), 500);
    // AI 助理浮窗（智能海外助理）
    initAIAssistant();
  },

  // Register SW and keep the app auto-updating without manual hard refresh
  initServiceWorker() {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('sw.js').catch(() => {});

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // A new version is installed and waiting to take over
            this.showUpdatePrompt(reg.waiting);
          }
        });
      });
      // Periodically check for new deploys while the tab stays open
      setInterval(() => { reg.update().catch(() => {}); }, 60000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
    }).catch(() => {});
  },

  showUpdatePrompt(worker) {
    if (document.getElementById('sw-update-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'sw-update-bar';
    bar.className = 'sw-update-bar';
    bar.innerHTML =
      '<span class="sw-update-text">🔄 发现新版本 (New version)</span>' +
      '<button id="sw-update-btn" class="sw-update-btn">更新</button>';
    document.body.appendChild(bar);
    const btn = document.getElementById('sw-update-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (worker && worker.postMessage) worker.postMessage('SKIP_WAITING');
        // controllerchange will then reload the page with the new bundle
      });
    }
  },

  generateDeviceId() {
    const id = 'pwa-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('pmapp_device_id', id);
    return id;
  },

  // Switch language and re-render
  changeLanguage(lang) {
    setLang(lang);
    applyTranslations();
    // Reload the current page to re-render dynamic content
    this.navigate(this.currentPage);
    // Re-render settings if on settings page
    if (this.currentPage === 'settings') this.loadSettings();
    this.toast(t('t_updating'));
  },

  /* ── 宽屏（领导电脑端）布局切换 ── */
  applyLayout() {
    const mq = window.matchMedia('(min-width: 860px)');
    const isDesktop = mq.matches;
    document.body.classList.toggle('desktop', isDesktop);
    // 首页导航标签：宽屏称「驾驶舱」
    const homeLabel = document.querySelector('.tab[data-page="home"] span:last-child');
    if (homeLabel) homeLabel.textContent = isDesktop ? '驾驶舱' : '首页';
    // 若在首页，按布局重渲染
    if (this.currentPage === 'home') {
      if (isDesktop) this.renderCockpit();
      else this.loadHome();
    }
  },
};

setupSupabaseClient(App);
setupAuth(App);
setupData(App);
setupHome(App);
setupPages(App);
setupDetail(App);
setupEdit(App);
setupReports(App);
setupNavigation(App);
setupUtils(App);
setupTranslate(App);
setupSyncQueue(App);
setupCockpit(App);
setupCharts(App);
setupFieldLog(App);

window.App = App;
App.init();
