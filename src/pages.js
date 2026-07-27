/* ═══ Tab Pages: Planning, Materials, Production, Quality, Inspection, Settings ═══ */
import { MODULES, STAGE_PROGRESS, APP_VERSION } from './config.js';
import { t } from './i18n.js';

export function setupPages(App) {
  /* ─── Planning Tab ─── */
  App.loadPlanning = function() {
    this.updateAdminButtons();
    const tasks = (this.cache.tasks || []).slice(0, 10);
    const tEl = document.getElementById('plan-tasks');
    if (tasks.length === 0) { tEl.innerHTML = `<div class="empty"><div class="empty-icon">📋</div>${t('empty_tasks')}</div>`; }
    else { tEl.innerHTML = tasks.map(t => `<div class="card" onclick="App.openDetail('tasks', ${t.id})">
      <div class="card-title">📋 ${this.esc(t.title)}</div>
      <div class="card-meta">
        ${t.status ? `<span class="badge ${this.badgeClass(t.status)}">${this.esc(t.status)}</span>` : ''}
        ${t.priority ? `<span class="badge ${this.badgeClass(t.priority)}">${this.esc(t.priority)}</span>` : ''}
        ${t.assignee ? `<span>👤 ${this.esc(t.assignee)}</span>` : ''}
        ${t.due_date ? `<span>📅 ${this.esc(t.due_date)}</span>` : ''}
      </div></div>`).join('');
    }
    this.renderTodos();
    this.renderOverdue();
    const shipping = (this.cache.shipping_plans || []).slice(0, 10);
    const sEl = document.getElementById('plan-shipping');
    if (shipping.length === 0) { sEl.innerHTML = `<div class="empty"><div class="empty-icon">🚢</div>${t('empty_shipping')}</div>`; }
    else { sEl.innerHTML = shipping.map(s => `<div class="card" onclick="App.openDetail('shipping_plans', ${s.id})">
      <div class="card-title">🚢 ${this.esc(s.plan_no)}</div>
      <div class="card-meta">
        ${s.status ? `<span class="badge ${this.badgeClass(s.status)}">${this.esc(s.status)}</span>` : ''}
        ${s.destination ? `<span>📍 ${this.esc(s.destination)}</span>` : ''}
        ${s.planned_ship_date ? `<span>📅 ${this.esc(s.planned_ship_date)}</span>` : ''}
      </div></div>`).join('');
    }
  };

  /* ─── 待执行任务（checkbox 清单）─── */
  App.renderTodos = function() {
    const el = document.getElementById('plan-todos');
    if (!el) return;
    const list = (this.cache.todos || []).slice(0, 50);
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">✅</div>${t('todo_empty')}</div>`; return; }
    const now = Date.now();
    el.innerHTML = list.map(r => {
      const done = !!r.done;
      const due = r.due_date || '';
      let overdue = false;
      if (due && !done) {
        const d = new Date(due.length === 10 ? due + 'T23:59:59' : due);
        overdue = d.getTime() < now;
      }
      return `<div class="todo-item ${done ? 'done' : ''}" data-id="${r.id}">
        <input type="checkbox" ${done ? 'checked' : ''} onchange="App.toggleTodo(${r.id})" />
        <div class="todo-body">
          <div class="todo-content">${this.esc(r.content || '')}</div>
          <div class="todo-due">
            <span>📅 ${due ? this.esc(due) : t('todo_no_due')}</span>
            ${overdue ? `<span class="todo-overdue" title="${t('todo_overdue')}">⚠️</span>` : ''}
          </div>
        </div>
        <span class="todo-del" onclick="App.deleteTodo(${r.id})">✕</span>
      </div>`;
    }).join('');
  };

  App.addTodo = async function() {
    const cEl = document.getElementById('todo-content');
    const dEl = document.getElementById('todo-due');
    if (!cEl) return;
    const content = cEl.value.trim();
    const due = dEl ? dEl.value : '';
    if (!content) { this.toast(t('todo_ph_content')); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id = Math.floor(Date.now() / 1000);
    const rec = { id, content, due_date: due, done: false, created_at: now };
    (this.cache.todos = this.cache.todos || []).unshift(rec);
    cEl.value = ''; if (dEl) dEl.value = '';
    this.renderTodos();
    try {
      await this.sbPost('sync_data', {
        table_name: 'todos', local_id: id,
        payload: JSON.stringify(rec), supabase_id: this.uuid(),
        is_deleted: false, updated_at: new Date().toISOString(), device_id: this.deviceId,
      });
    } catch (e) { /* 离线时由 sync 队列兜底，不抛错 */ }
  };

  App.toggleTodo = async function(id) {
    const list = this.cache.todos || [];
    const rec = list.find(r => r.id === id);
    if (!rec) return;
    rec.done = !rec.done;
    rec.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    this.renderTodos();
    this.renderOverdue();
    try {
      const q = rec._sb_id ? `supabase_id=eq.${rec._sb_id}` : `local_id=eq.${id}`;
      await this.sbPatch('sync_data', q, {
        payload: JSON.stringify(rec), updated_at: new Date().toISOString(), device_id: this.deviceId,
      });
    } catch (e) {}
  };

  App.deleteTodo = async function(id) {
    const list = this.cache.todos || [];
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return;
    const rec = list[idx];
    list.splice(idx, 1);
    this.renderTodos();
    try {
      const q = rec._sb_id ? `supabase_id=eq.${rec._sb_id}` : `local_id=eq.${id}`;
      await this.sbPatch('sync_data', q, { is_deleted: true, updated_at: new Date().toISOString() });
    } catch (e) {}
  };

  /* ─── 延误计划（自动罗列已到期未完成任务）─── */
  App.renderOverdue = function() {
    const el = document.getElementById('plan-overdue');
    if (!el) return;
    const now = Date.now();
    const list = (this.cache.todos || []).filter(r => {
      if (r.done) return false;
      const due = r.due_date || '';
      if (!due) return false;
      const d = new Date(due.length === 10 ? due + 'T23:59:59' : due);
      return d.getTime() < now;
    });
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">🎉</div>${t('overdue_empty')}</div>`; return; }
    el.innerHTML = list.map(r => `<div class="todo-item overdue-row" data-id="${r.id}">
      <input type="checkbox" onchange="App.toggleTodo(${r.id})" />
      <div class="todo-body">
        <div class="todo-content">${this.esc(r.content || '')}</div>
        <div class="todo-due">
          <span>📅 ${this.esc(r.due_date || '')}</span>
          <span class="todo-overdue" title="${t('todo_overdue')}">⚠️ ${t('todo_overdue')}</span>
        </div>
      </div>
    </div>`).join('');
  };

  /* ─── Materials Tab ─── */
  App.loadMaterials = function() {
    this.updateAdminButtons();
    const alerts = this.cache.overseas_material_alerts || [];
    const aEl = document.getElementById('mat-alerts');
    if (alerts.length === 0) { aEl.innerHTML = `<div class="empty"><div class="empty-icon">🔔</div>${t('empty_alerts')}</div>`; }
    else { aEl.innerHTML = alerts.map(a => `<div class="card" onclick="App.openDetail('overseas_material_alerts', ${a.id})">
      <div class="card-title">🔔 ${this.esc(a.rule_name)}</div>
      <div class="card-meta">
        ${a.threshold_value ? `<span>${this.esc(a.threshold_value)}</span>` : ''}
        <span class="badge ${a.is_enabled ? 'badge-green' : 'badge-gray'}">${a.is_enabled ? t('lbl_enabled') : t('lbl_disabled')}</span>
      </div></div>`).join('');
    }
    const factories = this.cache.factory_info || [];
    const fEl = document.getElementById('mat-factories');
    if (factories.length === 0) { fEl.innerHTML = `<div class="empty"><div class="empty-icon">🏭</div>${t('empty_factories')}</div>`; }
    else { fEl.innerHTML = factories.map(f => `<div class="card" onclick="App.openDetail('factory_info', ${f.id})">
      <div class="card-title">🏭 ${this.esc(f.factory_name)}</div>
      <div class="card-meta">
        ${f.region ? `<span>📍 ${this.esc(f.region)}</span>` : ''}
        ${f.country ? `<span>🏳️ ${this.esc(f.country)}</span>` : ''}
        ${f.pm ? `<span>👤 ${this.esc(f.pm)}</span>` : ''}
      </div></div>`).join('');
    }
  };

  /* ─── Production Tab ─── */
  App.loadProduction = function() { this.renderProduction(); };

  App.setProdFilter = function(stage, el) {
    this.prodFilter = stage;
    document.querySelectorAll('#prod-filter .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.renderProduction();
  };

  App.renderProduction = function() {
    let projects = this.cache.projects || [];
    const q = document.getElementById('prod-search')?.value?.trim().toLowerCase();
    if (q) projects = projects.filter(p => p.name?.toLowerCase().includes(q) || p.customer_name_zh?.toLowerCase().includes(q) || p.product_model?.toLowerCase().includes(q));
    if (this.prodFilter !== 'all') projects = projects.filter(p => p.stage === this.prodFilter);
    const el = document.getElementById('prod-list');
    if (projects.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">🏭</div>${t('empty_projects')}</div>`; return; }
    el.innerHTML = projects.map(p => {
      const progress = STAGE_PROGRESS[p.stage] || (p.status === 'completed' ? 100 : 0);
      const pColor = progress >= 75 ? 'var(--accent-green)' : progress >= 50 ? 'var(--accent-orange)' : 'var(--accent-blue)';
      return `<div class="card" onclick="App.openProjectDetail(${p.id})">
        <div class="card-title">📦 ${this.esc(p.name)}</div>
        <div class="card-meta">
          ${p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(p.status)}</span>` : ''}
          ${p.stage ? `<span class="badge badge-purple">${this.esc(p.stage)}</span>` : ''}
          ${p.customer_name_zh ? `<span>👤 ${this.esc(p.customer_name_zh)}</span>` : ''}
          ${p.delivery_date ? `<span>📅 ${this.esc(p.delivery_date)}</span>` : ''}
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;background:${pColor}"></div></div>
      </div>`;
    }).join('');
  };

  /* ─── Quality Tab ─── */
  App.loadQuality = function() {
    const mod = this.qualModule || 'issues';
    const issuesBlock = document.getElementById('qual-issues-block');
    const inspBlock = document.getElementById('qual-insp-block');
    if (mod === 'inspection') {
      if (issuesBlock) issuesBlock.style.display = 'none';
      if (inspBlock) inspBlock.style.display = '';
      this.renderInspectionList();
      this.updateAdminButtons();
      return;
    }
    if (issuesBlock) issuesBlock.style.display = '';
    if (inspBlock) inspBlock.style.display = 'none';
    const issues = this.cache.issues || [];
    document.getElementById('qs-total').textContent = issues.length;
    document.getElementById('qs-open').textContent = issues.filter(i => i.status === 'open').length;
    document.getElementById('qs-progress').textContent = issues.filter(i => ['assigned', 'analyzing', 'fixing', 'verifying'].includes(i.status)).length;
    document.getElementById('qs-closed').textContent = issues.filter(i => i.status === 'closed').length;
    this.renderQuality();
    this.updateAdminButtons();
  };

  App.setQualModule = function(mod, el) {
    this.qualModule = mod;
    document.querySelectorAll('#qual-mod-switch .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    this.currentModule = (mod === 'inspection') ? 'inspection' : 'issues';
    this.loadQuality();
  };

  App.renderInspectionList = function() {
    const list = (this.cache.inspection || []);
    const el = document.getElementById('qual-insp-list');
    if (!el) return;
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>${t('empty_insp')}</div>`; return; }
    el.innerHTML = list.slice().sort((a, b) => (b.inspect_date || '').localeCompare(a.inspect_date || '')).map(r => `<div class="card" onclick="App.openDetail('inspection', ${r.id})">
      <div class="card-title">🔍 ${this.esc(r.unit || '客验')}</div>
      <div class="card-meta">
        ${r.item ? `<span class="badge badge-cyan">${this.esc(r.item)}</span>` : ''}
        ${r.inspect_date ? `<span>📅 ${this.esc(r.inspect_date)}</span>` : ''}
        ${r.qty ? `<span>🔢 ${this.esc(r.qty)}</span>` : ''}
        ${r.order_no ? `<span>📄 ${this.esc(r.order_no)}</span>` : ''}
      </div></div>`).join('');
  };

  App.setQualFilter = function(filter, el) {
    this.qualFilter = filter;
    document.querySelectorAll('#qual-filter .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.renderQuality();
  };

  App.renderQuality = function() {
    if ((this.qualModule || 'issues') !== 'issues') return;
    let issues = this.cache.issues || [];
    const q = document.getElementById('qual-search')?.value?.trim().toLowerCase();
    if (q) issues = issues.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.assigned_to?.toLowerCase().includes(q));
    if (this.qualFilter === 'open') issues = issues.filter(i => i.status === 'open');
    else if (this.qualFilter === 'progress') issues = issues.filter(i => ['assigned', 'analyzing', 'fixing', 'verifying'].includes(i.status));
    else if (this.qualFilter === 'closed') issues = issues.filter(i => i.status === 'closed');
    const el = document.getElementById('qual-list');
    if (issues.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>${t('empty_issues')}</div>`; return; }
    el.innerHTML = issues.map(i => `<div class="card" onclick="App.openDetail('issues', ${i.id})">
      <div class="card-title">⚠️ ${this.esc(i.title)}</div>
      <div class="card-meta">
        ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : ''}
        ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : ''}
        ${i.issue_type ? `<span class="badge badge-cyan">${this.esc(i.issue_type)}</span>` : ''}
        ${i.assigned_to ? `<span>👤 ${this.esc(i.assigned_to)}</span>` : ''}
      </div></div>`).join('');
  };

  /* ─── RMD Tab ─── */
  App.loadInspection = function() {
    const projSel = document.getElementById('rmd-project');
    if (projSel) {
      const projects = (this.cache.projects || []);
      projSel.innerHTML = '<option value="">（未选）</option>' + projects.map(p => `<option value="${this.esc(p.name)}">${this.esc(p.name)}</option>`).join('');
    }
    const list = (this.cache.rmd || []).slice().sort((a, b) => (b.sign_date || '').localeCompare(a.sign_date || ''));
    const el = document.getElementById('rmd-list');
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">📑</div>暂无 RMD 记录</div>`; }
    else {
      el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('rmd', ${r.id})">
        <div class="card-title">📑 ${this.esc(r.material_name || 'RMD')}</div>
        <div class="card-meta">
          ${r.country ? `<span class="badge badge-blue">${this.esc(r.country)}</span>` : ''}
          ${r.factory ? `<span>🏭 ${this.esc(r.factory)}</span>` : ''}
          ${r.sign_date ? `<span>📅 ${this.esc(r.sign_date)}</span>` : ''}
          ${r.qty ? `<span>🔢 ${this.esc(r.qty)}</span>` : ''}
        </div></div>`).join('');
    }
    const chartEl = document.getElementById('rmd-chart');
    if (chartEl) chartEl.innerHTML = this._rmdTrend();
  };

  App.saveRmd = async function() {
    const get = id => { const e = document.getElementById(id); return e ? (e.value || '').trim() : ''; };
    const country = get('rmd-country');
    const factory = get('rmd-factory');
    const sign_date = get('rmd-sign_date');
    const project = get('rmd-project');
    const material_name = get('rmd-material_name');
    const material_batch = get('rmd-material_batch');
    const material_no = get('rmd-material_no');
    const qty = get('rmd-qty');
    const internal_confirm = get('rmd-internal_confirm');
    if (!material_name) { this.toast('物料名不能为空'); return; }
    const now = new Date().toISOString();
    const id = Math.floor(Date.now() / 1000);
    const payload = { id, country, factory, sign_date, project, material_name, material_batch, material_no, qty, internal_confirm, created_at: now.slice(0, 19).replace('T', ' ') };
    try {
      await this.sbPost('sync_data', { table_name: 'rmd', local_id: id, payload: JSON.stringify(payload), supabase_id: this.uuid(), is_deleted: false, updated_at: now, device_id: this.deviceId });
      this.cache.rmd = this.cache.rmd || [];
      this.cache.rmd.unshift(payload);
      this.toast('已保存 RMD');
      this.loadInspection();
      ['rmd-factory', 'rmd-sign_date', 'rmd-material_name', 'rmd-material_batch', 'rmd-material_no', 'rmd-qty', 'rmd-internal_confirm'].forEach(id2 => { const e = document.getElementById(id2); if (e) e.value = ''; });
    } catch (e) { this.toast('保存失败: ' + e.message); }
  };

  App._rmdTrend = function() {
    const list = (this.cache.rmd || []).filter(r => r.sign_date).slice().sort((a, b) => a.sign_date.localeCompare(b.sign_date));
    if (list.length === 0) return '<div class="empty" style="padding:12px">暂无数据</div>';
    const map = {};
    list.forEach(r => { map[r.sign_date] = (map[r.sign_date] || 0) + 1; });
    const dates = Object.keys(map).sort();
    let cum = 0;
    const values = dates.map(d => { cum += map[d]; return cum; });
    return this._rptLine(dates.map(d => d.length > 5 ? d.slice(5) : d), [{ name: 'RMD 累计', color: '#e94560', values }]);
  };

  /* ─── Settings ─── */
  App.loadSettings = function() {
    const loginArea = document.getElementById('settings-login-area');
    const infoArea = document.getElementById('settings-info');
    if (!this.isLoggedIn()) {
      infoArea.style.display = 'none';
      loginArea.innerHTML = `<div class="login-box">
        <div class="login-box-title">${t('login_title')}</div>
        <form onsubmit="return App.login(event)">
          <div class="input-group"><label>${t('lbl_username')}</label><input type="text" id="login-email" placeholder="admin" autocomplete="username" required></div>
          <div class="input-group"><label>${t('lbl_password')}</label><input type="password" id="login-password" placeholder="********" autocomplete="current-password" required></div>
          <div class="input-group"><label>${t('lbl_proxy')}</label><input type="text" id="login-proxy-url" placeholder="https://xxx.trycloudflare.com/proxy" autocomplete="off"></div>
          <button type="submit" class="btn btn-primary" id="login-btn">${t('btn_login')}</button>
          <div style="font-size:12px;color:var(--text-muted);text-align:center;margin-top:10px">${t('login_hint')}</div>
          <div style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:4px;opacity:0.5">PWA ${APP_VERSION}</div>
          <div class="login-error" id="login-error" style="color:var(--accent);font-size:13px;text-align:center;margin-top:8px;min-height:16px"></div>
        </form>
      </div>`;
      const savedProxy = App.getProxyUrl ? App.getProxyUrl() : '';
      setTimeout(() => { const el = document.getElementById('login-proxy-url'); if (el && savedProxy) el.value = savedProxy; }, 0);
    } else {
      loginArea.innerHTML = '';
      infoArea.style.display = 'block';
      document.getElementById('set-user').textContent = this.session.user.display_name || this.session.user.username || '-';
      const role = this.session.user.role;
      document.getElementById('set-role').textContent = role === 'admin' ? t('role_admin') : role === 'viewer' ? t('role_viewer') : role;
      document.getElementById('set-device').textContent = this.deviceId || '-';
      document.getElementById('set-sync').textContent = localStorage.getItem('pmapp_last_sync') || t('never');
      document.getElementById('set-proxy').textContent = this.getProxyUrl() || '-';
      document.getElementById('proxy-url-input').value = this.getProxyUrl() || '';
      let total = 0;
      Object.keys(MODULES).forEach(k => total += (this.cache[k] || []).length);
      total += (this.cache.message_board || []).length;
      document.getElementById('set-count').textContent = total + ' ' + t('records');

    }
    // Render language selector (always visible)
    const langGrid = document.getElementById('lang-grid');
    if (langGrid) {
      const currentLang = this.getLang();
      langGrid.innerHTML = Object.entries(this.LANGUAGES).map(([code, info]) => {
        const active = code === currentLang ? 'active' : '';
        return `<div class="lang-item ${active}" onclick="App.changeLanguage('${code}')">
          <span class="lang-flag">${info.flag}</span>
          <span>${info.name}</span>
        </div>`;
      }).join('');
    }
    this.updateAdminButtons();
  };

  App.updateAdminButtons = function() {
    const show = this.isAdmin();
    ['plan-task-add', 'mat-alert-add', 'mat-factory-add'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? '' : 'none';
    });
    const qi = document.getElementById('qual-insp-add');
    if (qi) qi.style.display = (show && (this.qualModule === 'inspection')) ? '' : 'none';
  };

  /* ─── Sync / Force Update ─── */
  App.syncNow = async function() {
    this.toast(t('t_updating'));
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      const url = window.location.href.split('?')[0] + '?t=' + Date.now();
      window.location.href = url;
    } catch (e) {
      window.location.reload();
    }
  };
}
