/* ═══ Navigation & Utilities ═══ */
import { t, applyTranslations } from './i18n.js';

export function setupNavigation(App) {
  App.showApp = function() {
    document.getElementById('tabbar').style.display = 'flex';
    document.getElementById('topbar').style.display = 'flex';
    this.navigate('home');
  };

  App.navigate = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.tab[data-page="${page}"]`);
    if (tab) tab.classList.add('active');
    const titleKeys = { home: 'app_slogan', planning: 'tab_planning', materials: 'tab_materials', production: 'tab_production', quality: 'tab_quality', inspection: 'tab_inspection', reports: 'tab_reports', settings: 'tab_settings' };
    document.getElementById('tb-title').textContent = page === 'home' ? 'PMApp' : t(titleKeys[page] || 'app_slogan');
    document.getElementById('tb-back').style.display = 'none';
    document.getElementById('tb-action').innerHTML = '';
    document.getElementById('fab').style.display = 'none';
    // Re-apply translations for the active page's static elements
    applyTranslations();
    if (page === 'home') this.loadHome();
    else if (page === 'planning') this.loadPlanning();
    else if (page === 'materials') this.loadMaterials();
    else if (page === 'production') { this.loadProduction(); if (this.isAdmin()) document.getElementById('fab').style.display = 'flex'; }
    else if (page === 'quality') { this.qualModule = this.qualModule || 'issues'; this.loadQuality(); if (this.isAdmin()) document.getElementById('fab').style.display = 'flex'; }
    else if (page === 'inspection') this.loadInspection();
    else if (page === 'reports') this.loadReports();
    else if (page === 'settings') this.loadSettings();
    this.currentPage = page;
    this.currentModule = (page === 'production') ? 'projects' : (page === 'quality') ? ((this.qualModule === 'inspection') ? 'inspection' : 'issues') : null;
    window.scrollTo(0, 0);
  };

  App.goBack = function() {
    if (this.pageStack.length > 0) {
      const prev = this.pageStack.pop();
      this.navigate(prev);
    }
  };

  App.pushPage = function(page) {
    this.pageStack.push(this.currentPage);
    this.navigate(page);
  };

  App.closeModal = function(e) {
    if (e && e.target.id !== 'modal-overlay') return;
    document.getElementById('modal-overlay').classList.remove('show');
    document.getElementById('tb-action').innerHTML = '';
    if (this.currentPage === 'module-detail' && this.currentModule && this.isAdmin()) {
      document.getElementById('tb-action').innerHTML = `<span onclick="App.showEditFor('${this.currentModule}', ${this.currentRecordId})">${t('btn_edit')}</span>`;
    } else if (this.currentPage === 'project-detail' && this.isAdmin()) {
      document.getElementById('tb-action').innerHTML = `<span onclick="App.showEditFor('projects', ${this.currentRecordId})">${t('btn_edit')}</span>`;
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
    const pages = ['home', 'planning', 'materials', 'production', 'quality', 'inspection', 'settings'];
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
