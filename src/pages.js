/* ═══ Tab Pages: Planning, Materials, Production, Quality, Inspection, Settings ═══ */
import { MODULES, STAGE_PROGRESS, APP_VERSION } from './config.js';

export function setupPages(App) {
  /* ─── Planning Tab ─── */
  App.loadPlanning = function() {
    this.updateAdminButtons();
    const tasks = (this.cache.tasks || []).slice(0, 10);
    const tEl = document.getElementById('plan-tasks');
    if (tasks.length === 0) { tEl.innerHTML = '<div class="empty"><div class="empty-icon">📋</div>暂无任务</div>'; }
    else { tEl.innerHTML = tasks.map(t => `<div class="card" onclick="App.openDetail('tasks', ${t.id})">
      <div class="card-title">📋 ${this.esc(t.title)}</div>
      <div class="card-meta">
        ${t.status ? `<span class="badge ${this.badgeClass(t.status)}">${this.esc(t.status)}</span>` : ''}
        ${t.priority ? `<span class="badge ${this.badgeClass(t.priority)}">${this.esc(t.priority)}</span>` : ''}
        ${t.assignee ? `<span>👤 ${this.esc(t.assignee)}</span>` : ''}
        ${t.due_date ? `<span>📅 ${this.esc(t.due_date)}</span>` : ''}
      </div></div>`).join('');
    }
    const meetings = (this.cache.meetings || []).slice(0, 10);
    const mEl = document.getElementById('plan-meetings');
    if (meetings.length === 0) { mEl.innerHTML = '<div class="empty"><div class="empty-icon">📅</div>暂无会议</div>'; }
    else { mEl.innerHTML = meetings.map(m => `<div class="card" onclick="App.openDetail('meetings', ${m.id})">
      <div class="card-title">📅 ${this.esc(m.room_name)}</div>
      <div class="card-meta">
        ${m.start_time ? `<span>🕐 ${this.esc(m.start_time)}</span>` : ''}
        ${m.end_time ? `<span>→ ${this.esc(m.end_time)}</span>` : ''}
      </div></div>`).join('');
    }
    const shipping = (this.cache.shipping_plans || []).slice(0, 10);
    const sEl = document.getElementById('plan-shipping');
    if (shipping.length === 0) { sEl.innerHTML = '<div class="empty"><div class="empty-icon">🚢</div>暂无出货计划</div>'; }
    else { sEl.innerHTML = shipping.map(s => `<div class="card" onclick="App.openDetail('shipping_plans', ${s.id})">
      <div class="card-title">🚢 ${this.esc(s.plan_no)}</div>
      <div class="card-meta">
        ${s.status ? `<span class="badge ${this.badgeClass(s.status)}">${this.esc(s.status)}</span>` : ''}
        ${s.destination ? `<span>📍 ${this.esc(s.destination)}</span>` : ''}
        ${s.planned_ship_date ? `<span>📅 ${this.esc(s.planned_ship_date)}</span>` : ''}
      </div></div>`).join('');
    }
  };

  /* ─── Materials Tab ─── */
  App.loadMaterials = function() {
    this.updateAdminButtons();
    const alerts = this.cache.overseas_material_alerts || [];
    const aEl = document.getElementById('mat-alerts');
    if (alerts.length === 0) { aEl.innerHTML = '<div class="empty"><div class="empty-icon">🔔</div>暂无预警</div>'; }
    else { aEl.innerHTML = alerts.map(a => `<div class="card" onclick="App.openDetail('overseas_material_alerts', ${a.id})">
      <div class="card-title">🔔 ${this.esc(a.rule_name)}</div>
      <div class="card-meta">
        ${a.threshold_value ? `<span>阈值: ${this.esc(a.threshold_value)}</span>` : ''}
        <span class="badge ${a.is_enabled ? 'badge-green' : 'badge-gray'}">${a.is_enabled ? '启用' : '禁用'}</span>
      </div></div>`).join('');
    }
    const factories = this.cache.factory_info || [];
    const fEl = document.getElementById('mat-factories');
    if (factories.length === 0) { fEl.innerHTML = '<div class="empty"><div class="empty-icon">🏭</div>暂无工厂信息</div>'; }
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
    if (projects.length === 0) { el.innerHTML = '<div class="empty"><div class="empty-icon">🏭</div>暂无项目</div>'; return; }
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
    const issues = this.cache.issues || [];
    document.getElementById('qs-total').textContent = issues.length;
    document.getElementById('qs-open').textContent = issues.filter(i => i.status === 'open').length;
    document.getElementById('qs-progress').textContent = issues.filter(i => ['assigned', 'analyzing', 'fixing', 'verifying'].includes(i.status)).length;
    document.getElementById('qs-closed').textContent = issues.filter(i => i.status === 'closed').length;
    this.renderQuality();
  };

  App.setQualFilter = function(filter, el) {
    this.qualFilter = filter;
    document.querySelectorAll('#qual-filter .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.renderQuality();
  };

  App.renderQuality = function() {
    let issues = this.cache.issues || [];
    const q = document.getElementById('qual-search')?.value?.trim().toLowerCase();
    if (q) issues = issues.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.assigned_to?.toLowerCase().includes(q));
    if (this.qualFilter === 'open') issues = issues.filter(i => i.status === 'open');
    else if (this.qualFilter === 'progress') issues = issues.filter(i => ['assigned', 'analyzing', 'fixing', 'verifying'].includes(i.status));
    else if (this.qualFilter === 'closed') issues = issues.filter(i => i.status === 'closed');
    const el = document.getElementById('qual-list');
    if (issues.length === 0) { el.innerHTML = '<div class="empty"><div class="empty-icon">⚠️</div>暂无问题</div>'; return; }
    el.innerHTML = issues.map(i => `<div class="card" onclick="App.openDetail('issues', ${i.id})">
      <div class="card-title">⚠️ ${this.esc(i.title)}</div>
      <div class="card-meta">
        ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : ''}
        ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : ''}
        ${i.issue_type ? `<span class="badge badge-cyan">${this.esc(i.issue_type)}</span>` : ''}
        ${i.assigned_to ? `<span>👤 ${this.esc(i.assigned_to)}</span>` : ''}
      </div></div>`).join('');
  };

  /* ─── Inspection Tab ─── */
  App.loadInspection = function() {
    const shipping = this.cache.shipping_plans || [];
    const sEl = document.getElementById('insp-shipping');
    if (shipping.length === 0) { sEl.innerHTML = '<div class="empty"><div class="empty-icon">🚢</div>暂无出货计划</div>'; }
    else {
      sEl.innerHTML = shipping.map(s => {
        const inspected = s.status === 'inspected' || s.status === 'shipped';
        return `<div class="card" onclick="App.openDetail('shipping_plans', ${s.id})">
          <div class="card-title">🚢 ${this.esc(s.plan_no)}</div>
          <div class="card-meta">
            ${s.status ? `<span class="badge ${this.badgeClass(s.status)}">${this.esc(s.status)}</span>` : ''}
            ${s.destination ? `<span>📍 ${this.esc(s.destination)}</span>` : ''}
            ${s.planned_ship_date ? `<span>📅 ${this.esc(s.planned_ship_date)}</span>` : ''}
            ${s.total_boxes ? `<span>📦 ${this.esc(s.total_boxes)}箱</span>` : ''}
          </div>
          ${inspected ? '<div style="margin-top:6px"><span class="badge badge-green">✅ 已检验</span></div>' : '<div style="margin-top:6px"><span class="badge badge-orange">⏳ 待检验</span></div>'}
        </div>`;
      }).join('');
    }
    const inspIssues = (this.cache.issues || []).filter(i => i.issue_type === 'inspection');
    const iEl = document.getElementById('insp-issues');
    if (inspIssues.length === 0) { iEl.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div>暂无检验问题</div>'; }
    else {
      iEl.innerHTML = inspIssues.map(i => `<div class="card" onclick="App.openDetail('issues', ${i.id})">
        <div class="card-title">🔍 ${this.esc(i.title)}</div>
        <div class="card-meta">
          ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : ''}
          ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : ''}
          ${i.assigned_to ? `<span>👤 ${this.esc(i.assigned_to)}</span>` : ''}
        </div></div>`).join('');
    }
  };

  /* ─── Settings ─── */
  App.loadSettings = function() {
    const loginArea = document.getElementById('settings-login-area');
    const infoArea = document.getElementById('settings-info');
    if (!this.isLoggedIn()) {
      infoArea.style.display = 'none';
      loginArea.innerHTML = `<div class="login-box">
        <div class="login-box-title">🔐 登录 PMApp</div>
        <form onsubmit="return App.login(event)">
          <div class="input-group"><label>用户名</label><input type="text" id="login-email" placeholder="admin" autocomplete="username" required></div>
          <div class="input-group"><label>密码</label><input type="password" id="login-password" placeholder="********" autocomplete="current-password" required></div>
          <div class="input-group"><label>代理 URL（可选）</label><input type="text" id="login-proxy-url" placeholder="https://xxx.trycloudflare.com/proxy" autocomplete="off"></div>
          <button type="submit" class="btn btn-primary" id="login-btn">登录</button>
          <div style="font-size:12px;color:var(--text-muted);text-align:center;margin-top:10px">使用桌面端同一账号登录</div>
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
      document.getElementById('set-role').textContent = role === 'admin' ? '👑 管理员' : role === 'viewer' ? '👁 只读' : '✏️ ' + role;
      document.getElementById('set-device').textContent = this.deviceId || '-';
      document.getElementById('set-sync').textContent = localStorage.getItem('pmapp_last_sync') || '从未';
      document.getElementById('set-proxy').textContent = this.getProxyUrl() || '-';
      document.getElementById('proxy-url-input').value = this.getProxyUrl() || '';
      let total = 0;
      Object.keys(MODULES).forEach(k => total += (this.cache[k] || []).length);
      total += (this.cache.message_board || []).length;
      document.getElementById('set-count').textContent = total + ' 条';
    }
    this.updateAdminButtons();
  };

  App.updateAdminButtons = function() {
    const show = this.isAdmin();
    ['plan-task-add', 'mat-alert-add', 'mat-factory-add'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? '' : 'none';
    });
  };

  /* ─── Sync / Force Update ─── */
  App.syncNow = async function() {
    this.toast('正在更新界面与数据...');
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
