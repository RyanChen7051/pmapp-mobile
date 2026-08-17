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
import { setupMeetings } from './meetings.js';
import { setupNavigation, setupUtils } from './navigation.js';
import { setupTranslate, clearTranslateCache } from './translate.js';
import { setupSyncQueue } from './sync.js';
import { initAIAssistant } from './ai.js';
import { setupCockpit } from './cockpit.js';
import { setupCharts } from './charts.js';
import { setupFieldLog } from './fieldlog.js';
import { setupPush } from './push.js';

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
    this.setupAutoUpdate();
    // 宽屏（领导电脑端）自适应：初次判定 + 监听断点变化
    window.matchMedia('(min-width: 860px)').addEventListener('change', () => this.applyLayout());
    this.applyLayout();
    // Re-apply translations after dynamic content loads
    setTimeout(() => applyTranslations(), 500);
    // AI 助理浮窗（智能海外助理）
    initAIAssistant();
    // Web Push：若已授权则静默确保订阅存在（自愈换设备/过期）
    this.ensurePushSubscription();
  },

  // Register SW and keep the app auto-updating without manual hard refresh
  initServiceWorker() {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      // 新 SW 接管后自动刷新，拉取最新 bundle（发版零操作，根治 iOS 主屏 PWA 不更新）
      window.location.reload();
    });

    // updateViaCache:'none' 确保每次都向服务器验证 sw.js 字节，绕过 iOS 对 SW 脚本的缓存
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});

    navigator.serviceWorker.ready.then((reg) => {
      // 启动即检查一次更新（不等 60s 定时器），让发版尽快生效
      reg.update().catch(() => {});
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 新版本就绪 → 自动 SKIP_WAITING 接管，随后的 controllerchange 会自动刷新
              installing.postMessage('SKIP_WAITING');
            } else {
              // 首次安装，无旧控制器，直接刷新
              window.location.reload();
            }
          }
        });
      });
      // 周期性检查新部署；切回前台时也检查
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

  // ── 每日定时自动更新（北京时间 12:00 / 00:00，领导零操作）──
  // 到点自动清空 SW 缓存并硬刷新，拉取最新部署版本；若领导正在填表则延后 2 分钟。
  doScheduledUpdate() {
    const self = this;
    const finish = () => { window.location.reload(true); };
    self.toast('🔄 正在更新到最新版本…');
    const sw = navigator.serviceWorker;
    if (sw && sw.controller) {
      try {
        const ch = new MessageChannel();
        let reloaded = false;
        ch.port1.onmessage = (e) => { if (e.data === 'CACHE_CLEARED' && !reloaded) { reloaded = true; finish(); } };
        sw.controller.postMessage('CLEAR_CACHE', [ch.port2]);
        setTimeout(() => { if (!reloaded) { reloaded = true; finish(); } }, 2500);
      } catch (e) { finish(); }
    } else {
      finish();
    }
  },

  setupAutoUpdate() {
    if (!('serviceWorker' in navigator)) return;
    const BEIJING = 8 * 60; // 北京 = UTC+8（无夏令时）
    const self = this;

    // 以「北京墙钟」计算的当日档位 key（00:00 档 / 12:00 档），用于在前台补更新时去重
    const slotKey = () => {
      const b = new Date(Date.now() + BEIJING * 60000); // 此 Date 的 UTC 字段 = 北京墙钟（北京=UTC+8，与设备时区无关）
      const min = b.getUTCHours() * 60 + b.getUTCMinutes();
      const idx = min < 720 ? 0 : 1; // 0 => 当日 00:00 档, 1 => 当日 12:00 档
      return b.getUTCFullYear() + '-' + (b.getUTCMonth() + 1) + '-' + b.getUTCDate() + '#' + idx;
    };

    // 领导正在操作（弹窗打开 / 正在输入）则不打扰
    const busy = () => {
      const ov = document.getElementById('modal-overlay');
      if (ov && ov.classList.contains('show')) return true;
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true;
      return false;
    };

    let timer = null;
    const fire = () => {
      if (busy()) { timer = setTimeout(fire, 120000); return; } // 延时 2 分钟再试
      self.doScheduledUpdate();
    };

    // 计算到下一个北京 00:00 / 12:00 的毫秒数并定时触发
    const scheduleNext = () => {
      const b = new Date(Date.now() + BEIJING * 60000);
      const min = b.getUTCHours() * 60 + b.getUTCMinutes() + b.getUTCSeconds() / 60 + b.getUTCMilliseconds() / 60000;
      let delta = null;
      for (const s of [0, 720]) { // 00:00 与 12:00（北京）
        let dd = s - min;
        if (dd <= 0) dd += 1440;
        if (delta === null || dd < delta) delta = dd;
      }
      timer = setTimeout(fire, delta * 60000);
    };

    // 兜底：app 在后台/锁屏错过了整点，回到前台时补一次
    let lastVisible = slotKey();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { lastVisible = slotKey(); return; }
      const cur = slotKey();
      if (cur !== lastVisible) { lastVisible = cur; fire(); }
    });

    scheduleNext();
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
setupMeetings(App);
setupNavigation(App);
setupUtils(App);
setupTranslate(App);
setupSyncQueue(App);
setupCockpit(App);
setupCharts(App);
setupFieldLog(App);
setupPush(App);

window.App = App;
App.init();

// v3.16.0 URL 路由：?goto=planning / #planning 启动后自动跳到指定页（用于深链接分享 + 截图工具）
(function _applyInitialRoute() {
  const qs = new URLSearchParams(location.search);
  const fromQuery = qs.get('goto');
  const fromHash = (location.hash || '').replace('#', '').trim();
  const target = fromQuery || fromHash;
  if (target && App.navigate && ['home','factory','planning','materials','production','quality','engineering','factory_process','inspection','reports','fieldlog','settings'].includes(target)) {
    setTimeout(() => App.navigate(target), 800);
  }
})();
