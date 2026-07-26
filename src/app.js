/* ═══════════════════════════════════════════════════
   PMApp Mobile v3.3.0 — Modular Entry Point
   Assembles all modules into the global App object
   ═══════════════════════════════════════════════════ */
import { APP_VERSION } from './config.js';
import { setupSupabaseClient } from './supabase-client.js';
import { setupAuth } from './auth.js';
import { setupData } from './data.js';
import { setupHome } from './home.js';
import { setupPages } from './pages.js';
import { setupDetail } from './detail.js';
import { setupEdit } from './edit.js';
import { setupReports } from './reports.js';
import { setupNavigation, setupUtils } from './navigation.js';

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

  init() {
    this.deviceId = localStorage.getItem('pmapp_device_id') || this.generateDeviceId();
    const saved = localStorage.getItem('pmapp_session');
    if (saved) {
      try { this.session = JSON.parse(saved); } catch (e) { localStorage.removeItem('pmapp_session'); }
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    this.showApp();
    this.loadAll();
    this.setupPTR();
  },

  generateDeviceId() {
    const id = 'pwa-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('pmapp_device_id', id);
    return id;
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

window.App = App;
App.init();
