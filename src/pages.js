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
    this.populateTodoParents();
    this.renderTodos();
    this.renderOverdue();
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
          ${r.parent_plan ? `<div class="todo-parent">🔗 ${this.esc(r.parent_plan)}</div>` : ''}
        </div>
        <span class="todo-del" onclick="App.deleteTodo(${r.id})">✕</span>
      </div>`;
    }).join('');
  };

  App.populateTodoParents = function() {
    const sel = document.getElementById('todo-parent');
    if (!sel) return;
    const tasks = this.cache.tasks || [];
    sel.innerHTML = `<option value="">${t('todo_parent_none')}</option>` +
      tasks.map(tk => `<option value="${this.esc(tk.title || '')}">${this.esc((tk.title || '').slice(0, 40))}</option>`).join('');
  };

  App.addTodo = async function() {
    const cEl = document.getElementById('todo-content');
    const dEl = document.getElementById('todo-due');
    const pEl = document.getElementById('todo-parent');
    if (!cEl) return;
    const content = cEl.value.trim();
    const due = dEl ? dEl.value : '';
    if (!content) { this.toast(t('todo_ph_content')); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id = Math.floor(Date.now() / 1000);
    const parent = pEl ? pEl.value : '';
    const rec = { id, content, parent_plan: parent, due_date: due, done: false, created_at: now };
    (this.cache.todos = this.cache.todos || []).unshift(rec);
    cEl.value = ''; if (dEl) dEl.value = ''; if (pEl) pEl.value = '';
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
        ${r.parent_plan ? `<div class="todo-parent">🔗 ${this.esc(r.parent_plan)}</div>` : ''}
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
  };

  /* ─── Factory Tab (独立工厂讯息页) ─── */
  App.loadFactory = function() {
    this.updateAdminButtons();
    const factories = this.cache.factory_info || [];
    const el = document.getElementById('factory-list');
    if (factories.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">🏭</div>${t('empty_factories')}</div>`; return; }
    el.innerHTML = factories.map(f => `<div class="card" onclick="App.openDetail('factory_info', ${f.id})">
      <div class="card-title">🏭 ${this.esc(f.factory_name)}</div>
      <div class="card-meta">
        ${f.region ? `<span>📍 ${this.esc(f.region)}</span>` : ''}
        ${f.country ? `<span>🏳️ ${this.esc(f.country)}</span>` : ''}
        ${f.pm ? `<span>👤 ${this.esc(f.pm)}</span>` : ''}
      </div></div>`).join('');
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
        <div class="card-head">
          <div class="card-title">📦 ${this.esc(p.name)}</div>
          ${p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(p.status)}</span>` : ''}
        </div>
        <div class="prod-grid">
          ${p.order_no ? `<div class="prod-cell"><span class="prod-cell-label">订单号</span><span class="prod-cell-val">${this.esc(p.order_no)}</span></div>` : ''}
          ${p.delivery_date ? `<div class="prod-cell"><span class="prod-cell-label">计划交期</span><span class="prod-cell-val">${this.esc(p.delivery_date)}</span></div>` : ''}
          ${p.product_model ? `<div class="prod-cell"><span class="prod-cell-label">型号</span><span class="prod-cell-val">${this.esc(p.product_model)}</span></div>` : ''}
          ${p.quantity ? `<div class="prod-cell"><span class="prod-cell-label">数量</span><span class="prod-cell-val">${this.esc(p.quantity)}</span></div>` : ''}
        </div>
        <div class="card-meta">
          ${p.stage ? `<span class="badge badge-purple">${this.esc(p.stage)}</span>` : ''}
          ${p.customer_name_zh ? `<span>👤 ${this.esc(p.customer_name_zh)}</span>` : ''}
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
      this.renderFieldLogByCategory('qual-fieldlog', '品质');
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
    this.renderFieldLogByCategory('qual-fieldlog', '品质');
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

  /* ─── 工程 / 制程 Tab（与品质·问题同结构）─── */
  App.renderIssueModule = function (moduleKey, containerId) {
    let issues = this.cache[moduleKey] || [];
    const q = document.getElementById(containerId + '-search')?.value?.trim().toLowerCase();
    if (q) issues = issues.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.assigned_to?.toLowerCase().includes(q));
    const el = document.getElementById(containerId);
    if (!el) return;
    if (issues.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>暂无${moduleKey === 'engineering' ? '工程' : '制程'}问题</div>`; return; }
    el.innerHTML = issues.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(i => `<div class="card" onclick="App.openDetail('${moduleKey}', ${i.id})">
      <div class="card-title">⚠️ ${this.esc(i.title)}</div>
      <div class="card-meta">
        ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : ''}
        ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : ''}
        ${i.issue_type ? `<span class="badge badge-cyan">${this.esc(i.issue_type)}</span>` : ''}
        ${i.assigned_to ? `<span>👤 ${this.esc(i.assigned_to)}</span>` : ''}
      </div></div>`).join('');
  };

  App.loadEngineering = function() {
    this.updateAdminButtons();
    this.renderIssueModule('engineering', 'eng-list');
    this.renderFieldLogByCategory('eng-fieldlog', '工程');
  };

  App.loadFactoryProcess = function() {
    this.updateAdminButtons();
    this.renderIssueModule('factory_process', 'fp-list');
    this.renderFieldLogByCategory('fp-fieldlog', '制程');
  };

  /* ─── DOA / RMA Tab ─── */
  App.loadInspection = function() {
    const projects = (this.cache.projects || []);
    const opts = '<option value="">（未选）</option>' + projects.map(p => `<option value="${this.esc(p.name)}">${this.esc(p.name)}</option>`).join('');
    const dp = document.getElementById('doa-project'); if (dp) dp.innerHTML = opts;
    const rp = document.getElementById('rma-project'); if (rp) rp.innerHTML = opts;

    const doa = (this.cache.doa || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const de = document.getElementById('doa-list');
    if (doa.length === 0) { de.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>暂无 DOA 记录</div>`; }
    else {
      de.innerHTML = doa.map(r => {
        const rate = (r.received_qty > 0) ? (r.defect_qty / r.received_qty * 100) : 0;
        return `<div class="card" onclick="App.openDetail('doa', ${r.id})">
          <div class="card-title">⚠️ ${this.esc(r.material_name || 'DOA')}</div>
          <div class="card-meta">
            ${r.date ? `<span>📅 ${this.esc(r.date)}</span>` : ''}
            ${r.factory ? `<span>🏭 ${this.esc(r.factory)}</span>` : ''}
            ${r.received_qty ? `<span>来料 ${this.esc(r.received_qty)}</span>` : ''}
            ${r.defect_qty ? `<span>不良 ${this.esc(r.defect_qty)}</span>` : ''}
            ${rate ? `<span class="badge badge-red">不良率 ${rate.toFixed(1)}%</span>` : ''}
          </div></div>`;
      }).join('');
    }

    const rma = (this.cache.rma || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const re = document.getElementById('rma-list');
    if (rma.length === 0) { re.innerHTML = `<div class="empty"><div class="empty-icon">↩️</div>暂无 RMA 记录</div>`; }
    else {
      re.innerHTML = rma.map(r => `<div class="card" onclick="App.openDetail('rma', ${r.id})">
        <div class="card-title">↩️ ${this.esc(r.project || r.customer || 'RMA')}</div>
        <div class="card-meta">
          ${r.date ? `<span>📅 ${this.esc(r.date)}</span>` : ''}
          ${r.customer ? `<span>👤 ${this.esc(r.customer)}</span>` : ''}
          ${r.return_qty ? `<span>退 ${this.esc(r.return_qty)}</span>` : ''}
          ${r.status ? `<span class="badge badge-${r.status === '已关闭' ? 'gray' : 'orange'}">${this.esc(r.status)}</span>` : ''}
        </div></div>`).join('');
    }

    const dc = document.getElementById('doa-chart'); if (dc) dc.innerHTML = this._doaTrend();
    const rc = document.getElementById('rma-chart'); if (rc) rc.innerHTML = this._rmaTrend();
  };

  App._trendChart = function(labels, series) {
    const W = 320, H = 160, pl = 30, pr = 10, pt = 20, pb = 26;
    const cw = W - pl - pr, ch = H - pt - pb;
    let maxY = 1; series.forEach(s => s.values.forEach(v => { if (v > maxY) maxY = v; }));
    maxY = Math.ceil(maxY * 1.1); if (maxY < 2) maxY = 2;
    const n = labels.length;
    const xOf = i => pl + (n <= 1 ? cw / 2 : cw * i / (n - 1));
    const yOf = v => pt + ch - (v / maxY) * ch;
    let grid = '';
    for (let k = 0; k <= 4; k++) {
      const y = pt + ch * k / 4;
      grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
      grid += `<text x="${pl - 4}" y="${y + 3}" fill="#94a3b8" font-size="8" text-anchor="end">${Math.round(maxY * (4 - k) / 4)}</text>`;
    }
    const step = Math.max(1, Math.floor(n / 6));
    let xlab = '';
    for (let i = 0; i < n; i += step) xlab += `<text x="${xOf(i)}" y="${H - 8}" fill="#94a3b8" font-size="9" text-anchor="middle">${labels[i]}</text>`;
    let lines = '';
    series.forEach(s => {
      const pts = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
      lines += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
      s.values.forEach((v, i) => { lines += `<circle cx="${xOf(i)}" cy="${yOf(v)}" r="2.5" fill="${s.color}"/>`; });
    });
    let lx = pl, legend = '';
    series.forEach(s => { legend += `<rect x="${lx}" y="4" width="8" height="8" fill="${s.color}"/><text x="${lx + 11}" y="12" fill="#475569" font-size="9">${s.name}</text>`; lx += 11 + s.name.length * 6 + 12; });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}${xlab}${lines}${legend}</svg>`;
  };

  App._doaTrend = function() {
    const list = (this.cache.doa || []).filter(r => r.date && r.received_qty > 0).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) return '<div class="empty" style="padding:12px">暂无数据</div>';
    const map = {};
    list.forEach(r => { const m = r.date.slice(0, 7); if (!map[m]) map[m] = { rec: 0, def: 0 }; map[m].rec += (+r.received_qty); map[m].def += (+r.defect_qty); });
    const months = Object.keys(map).sort();
    const values = months.map(m => +(map[m].def / map[m].rec * 100).toFixed(2));
    return this._trendChart(months, [{ name: '不良率 %', color: '#e94560', values }]);
  };

  App._rmaTrend = function() {
    const list = (this.cache.rma || []).filter(r => r.date && r.return_qty > 0).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) return '<div class="empty" style="padding:12px">暂无数据</div>';
    const map = {};
    list.forEach(r => { const m = r.date.slice(0, 7); map[m] = (map[m] || 0) + (+r.return_qty); });
    const months = Object.keys(map).sort();
    const values = months.map(m => map[m]);
    return this._trendChart(months, [{ name: '退货数量', color: '#3b82f6', values }]);
  };

  App.saveDoa = async function() {
    const get = id => { const e = document.getElementById(id); return e ? (e.value || '').trim() : ''; };
    const material_name = get('doa-material_name');
    if (!material_name) { this.toast('物料名不能为空'); return; }
    const now = new Date().toISOString();
    const id = Math.floor(Date.now() / 1000);
    const received = parseFloat(get('doa-received_qty')) || 0;
    const defect = parseFloat(get('doa-defect_qty')) || 0;
    const payload = {
      id, date: get('doa-date'), project: get('doa-project'), factory: get('doa-factory'),
      material_name, material_batch: get('doa-material_batch'),
      received_qty: received, defect_qty: defect,
      defect_rate: received > 0 ? +(defect / received * 100).toFixed(2) : 0,
      description: get('doa-description'), internal_confirm: get('doa-internal_confirm'),
      created_at: now.slice(0, 19).replace('T', ' ')
    };
    try {
      await this.sbPost('sync_data', { table_name: 'doa', local_id: id, payload: JSON.stringify(payload), supabase_id: this.uuid(), is_deleted: false, updated_at: now, device_id: this.deviceId });
      this.cache.doa = this.cache.doa || [];
      this.cache.doa.unshift(payload);
      this.toast('已保存 DOA');
      this.loadInspection();
      ['doa-date', 'doa-project', 'doa-factory', 'doa-material_name', 'doa-material_batch', 'doa-received_qty', 'doa-defect_qty', 'doa-description', 'doa-internal_confirm'].forEach(id2 => { const e = document.getElementById(id2); if (e) e.value = ''; });
    } catch (e) { this.toast('保存失败: ' + e.message); }
  };

  App.saveRma = async function() {
    const get = id => { const e = document.getElementById(id); return e ? (e.value || '').trim() : ''; };
    const project = get('rma-project');
    const customer = get('rma-customer');
    if (!project && !customer) { this.toast('项目或客户至少填一项'); return; }
    const now = new Date().toISOString();
    const id = Math.floor(Date.now() / 1000);
    const payload = {
      id, date: get('rma-date'), project, customer,
      return_qty: parseFloat(get('rma-return_qty')) || 0,
      reason: get('rma-reason'), status: get('rma-status'),
      description: get('rma-description'),
      created_at: now.slice(0, 19).replace('T', ' ')
    };
    try {
      await this.sbPost('sync_data', { table_name: 'rma', local_id: id, payload: JSON.stringify(payload), supabase_id: this.uuid(), is_deleted: false, updated_at: now, device_id: this.deviceId });
      this.cache.rma = this.cache.rma || [];
      this.cache.rma.unshift(payload);
      this.toast('已保存 RMA');
      this.loadInspection();
      ['rma-date', 'rma-project', 'rma-customer', 'rma-return_qty', 'rma-reason', 'rma-status', 'rma-description'].forEach(id2 => { const e = document.getElementById(id2); if (e) e.value = ''; });
    } catch (e) { this.toast('保存失败: ' + e.message); }
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
    // 各「+ 新建」按钮按模块权限显示（admin 始终可见；其余按 MODULE_PERMISSIONS）
    const map = {
      'plan-task-add': this.isAdmin(),            // 计划任务：未授权额外用户
      'mat-alert-add': this.canEdit('overseas_material_alerts'), // 物料栏目 → 蒋思贵
      'mat-factory-add': this.isAdmin(),          // 冗余占位（物料页无此钮）
      'factory-add': this.isAdmin(),              // 工厂讯息：未授权额外用户
      'qual-insp-add': this.canEdit('inspection'),// 品质(客验) → 陈晓斌
      'eng-add': this.canEdit('engineering'),      // 工程 → 陈晓斌
      'fp-add': this.canEdit('factory_process'),   // 制程 → 暂未开放
      'fieldlog-add': this.canEdit('field_log'),  // 现场记录 → 管理员(驻点人员)
    };
    Object.entries(map).forEach(([id, show]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? '' : 'none';
    });
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
