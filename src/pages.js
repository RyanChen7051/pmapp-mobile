/* ═══ Tab Pages: Planning, Materials, Production, Quality, Inspection, Settings ═══ */
import { MODULES, STAGE_PROGRESS, APP_VERSION } from './config.js';
import { t, tr } from './i18n.js';

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
        ${t.plan_code ? `<span>🔢 ${this.esc(t.plan_code)}</span>` : ''}
        ${t.project_ref ? `<span>🗂 ${this.esc(t.project_ref)}</span>` : ''}
        ${t.status ? `<span class="badge ${this.badgeClass(t.status)}">${this.esc(tr(t.status))}</span>` : ''}
        ${t.priority ? `<span class="badge ${this.badgeClass(t.priority)}">${this.esc(tr(t.priority))}</span>` : ''}
        ${t.assignee ? `<span>👤 ${this.esc(t.assignee)}</span>` : ''}
        ${t.due_date ? `<span>📅 ${this.esc(t.due_date)}</span>` : ''}
      </div></div>`).join('');
    }
    this.populateTodoParents();
    this.renderProjectInfo();
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
          ${r.plan_code ? `<div class="todo-parent">🔢 ${this.esc(r.plan_code)}</div>` : (r.parent_plan ? `<div class="todo-parent">🔗 ${this.esc(r.parent_plan)}</div>` : '')}
          ${r.project_ref ? `<div class="todo-parent">🗂 ${this.esc(r.project_ref)}</div>` : ''}
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
    const id = this._newLocalId('todos');
    const plan = this._todoPlan || null;
    const rec = {
      id, content, due_date: due, done: false, created_at: now,
      parent_plan: plan ? (plan.title || '') : '',
      plan_code: plan ? (plan.code || '') : '',
      project_id: plan ? (plan.project_id || '') : '',
      project_ref: plan ? (plan.project_ref || '') : '',
    };
    (this.cache.todos = this.cache.todos || []).unshift(rec);
    cEl.value = ''; if (dEl) dEl.value = '';
    this._todoPlan = null;
    this.updateTodoPlanButton();
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
        ${r.plan_code ? `<div class="todo-parent">🔢 ${this.esc(r.plan_code)}</div>` : (r.parent_plan ? `<div class="todo-parent">🔗 ${this.esc(r.parent_plan)}</div>` : '')}
        ${r.project_ref ? `<div class="todo-parent">🗂 ${this.esc(r.project_ref)}</div>` : ''}
      </div>
    </div>`).join('');
  };

  /* ─── 项目讯息（生产计划「项目（可选）」的数据来源）───
   * 4 个字段：工厂项目编号 / 客户项目编号 / 生产工厂 / 项目阶段。
   * 存到 sync_data(table_name=project_info)，与 todos 同款轻量写法（离线由同步队列兜底）。 */
  const PROJECT_STAGES = [{ v: 'NPI', t: 'NPI' }, { v: 'EVT', t: 'EVT' }, { v: 'DVT', t: 'DVT' }, { v: 'PVT', t: 'PVT' }, { v: 'MP', t: '量产' }];

  App._piLabel = function(p) {
    if (!p) return '';
    return [p.factory_project_no, p.customer_project_no].filter(Boolean).join(' / ');
  };

  App._piStageText = function(v) {
    return v === 'MP' ? tr('量产') : (v || '');
  };

  App.renderProjectInfo = function() {
    const titleEl = document.getElementById('proj-info-title');
    if (titleEl) titleEl.textContent = tr('项目讯息');
    const addEl = document.getElementById('proj-info-add');
    if (addEl) addEl.textContent = '+ ' + tr('新建');
    const saveBtn = document.querySelector('#proj-info-form button');
    if (saveBtn) saveBtn.textContent = tr('保存');
    const fno = document.getElementById('pi-factory-no'); if (fno) fno.placeholder = tr('工厂项目编号');
    const cno = document.getElementById('pi-customer-no'); if (cno) cno.placeholder = tr('客户项目编号');
    this.updateProjectFactoryButton();
    const stage = document.getElementById('pi-stage');
    if (stage) {
      const cur = stage.value;
      stage.innerHTML = PROJECT_STAGES.map(o => `<option value="${o.v}">${this.esc(tr(o.t))}</option>`).join('');
      if (cur) stage.value = cur;
    }
    this.updateTodoPlanButton();

    const el = document.getElementById('proj-info-list');
    if (!el) return;
    const list = this.cache.project_info || [];
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">🗂</div>${tr('暂无项目讯息')}</div>`; return; }
    el.innerHTML = list.map(p => `<div class="card">
      <div class="card-title">🗂 ${this.esc(this._piLabel(p))}</div>
      <div class="card-meta">
        ${p.production_factory ? `<span>🏭 ${this.esc(p.production_factory)}</span>` : ''}
        ${p.project_stage ? `<span class="badge ${this.badgeClass(p.project_stage)}">${this.esc(this._piStageText(p.project_stage))}</span>` : ''}
        <span class="todo-del" onclick="App.deleteProjectInfo(${p.id})">✕</span>
      </div></div>`).join('');
  };

  /* ─── 项目讯息的「生产工厂」：点选，来源＝工厂模块（factory_info）───
   * 用 #picker-overlay（edit.js 的 _openPicker/closePicker），不占用主 modal。 */
  App.updateProjectFactoryButton = function() {
    const btn = document.getElementById('pi-factory-btn');
    if (!btn) return;
    const label = this._piFactory ? this._piFactory.name : tr('生产工厂');
    btn.innerHTML = `🏭 ${this.esc(label)}`;
  };

  App.pickProjectFactory = function() {
    const list = this.cache.factory_info || [];
    if (list.length === 0) { this.toast(tr('暂无工厂讯息')); return; }
    const html = `<div class="modal-handle"></div><div class="modal-title">${tr('生产工厂')}</div>` +
      list.map(f => `<div class="card" onclick="App.selectProjectFactory(${f.id})">
        <div class="card-title">🏭 ${this.esc(f.factory_name || '')}</div>
        <div class="card-meta">
          ${f.address ? `<span>🏠 ${this.esc(f.address)}</span>` : ''}
          ${f.region ? `<span>📍 ${this.esc(f.region)}</span>` : ''}
          ${f.country ? `<span>🏳️ ${this.esc(f.country)}</span>` : ''}
          ${f.pm ? `<span>👤 ${this.esc(f.pm)}</span>` : ''}
        </div></div>`).join('') +
      `<div style="height:10px"></div>
       <button class="btn btn-secondary" onclick="App.clearProjectFactory()">${tr('清除选择')}</button>
       <div style="height:10px"></div>
       <button class="btn btn-secondary" onclick="App.closePicker()">${tr('取消')}</button>`;
    this._openPicker(html);
  };

  App.selectProjectFactory = function(id) {
    const f = (this.cache.factory_info || []).find(r => String(r.id) === String(id));
    if (!f) return;
    this._piFactory = { id: f.id, name: f.factory_name || '' };
    this.updateProjectFactoryButton();
    this.closePicker();
  };

  App.clearProjectFactory = function() {
    this._piFactory = null;
    this.updateProjectFactoryButton();
    this.closePicker();
  };

  App.toggleProjectInfoForm = function() {
    const box = document.getElementById('proj-info-form');
    if (!box) return;
    const open = box.style.display === 'none' || box.style.display === '';
    box.style.display = open ? 'flex' : 'none';
    if (open) setTimeout(() => document.getElementById('pi-factory-no')?.focus(), 60);
  };

  App.saveProjectInfo = async function() {
    const fno = document.getElementById('pi-factory-no');
    if (!fno) return;
    const cno = document.getElementById('pi-customer-no');
    const stg = document.getElementById('pi-stage');
    const factory_project_no = fno.value.trim();
    if (!factory_project_no) { this.toast(tr('请输入工厂项目编号')); fno.focus(); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id = this._newLocalId('project_info');
    const rec = {
      id, factory_project_no,
      customer_project_no: cno ? cno.value.trim() : '',
      // 生产工厂来自「工厂」模块点选，不再手输
      production_factory: this._piFactory ? this._piFactory.name : '',
      factory_id: this._piFactory ? this._piFactory.id : '',
      project_stage: stg ? stg.value : 'NPI',
      created_at: now, updated_at: now,
    };
    (this.cache.project_info = this.cache.project_info || []).unshift(rec);
    fno.value = ''; if (cno) cno.value = '';
    this._piFactory = null;
    const box = document.getElementById('proj-info-form'); if (box) box.style.display = 'none';
    this.renderProjectInfo();
    try {
      await this.sbPost('sync_data', {
        table_name: 'project_info', local_id: id,
        payload: JSON.stringify(rec), supabase_id: this.uuid(),
        is_deleted: false, updated_at: new Date().toISOString(), device_id: this.deviceId,
      });
      this.toast(tr('已保存项目讯息'));
    } catch (e) { /* 离线时由同步队列兜底 */ }
  };

  App.deleteProjectInfo = async function(id) {
    const list = this.cache.project_info || [];
    const idx = list.findIndex(r => String(r.id) === String(id));
    if (idx < 0) return;
    const rec = list[idx];
    list.splice(idx, 1);
    if (this._todoPlan && String(this._todoPlan.project_id) === String(id)) this._todoPlan = null;
    this.renderProjectInfo();
    try {
      const q = rec._sb_id ? `supabase_id=eq.${rec._sb_id}` : `local_id=eq.${id}`;
      await this.sbPatch('sync_data', q, { is_deleted: true, updated_at: new Date().toISOString() });
    } catch (e) {}
    this.toast(tr('已删除项目讯息'));
  };

  // 生产计划（子计划）表单里的「项目计划编号（可选）」：点开从生产计划（主计划）里挑一条编号
  // 选中后子计划即继承主计划的项目关联（project_id / project_ref），与项目讯息串起来。
  App.pickTodoPlan = function() {
    const list = (this.cache.tasks || []).filter(x => x.plan_code);
    if (list.length === 0) { this.toast(tr('暂无项目计划')); return; }
    const mc = document.getElementById('modal-content');
    if (!mc) return;
    mc.innerHTML = `<div class="modal-handle"></div>
      <div class="modal-title">${tr('选择项目计划编号')}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${tr('项目计划编号（可选）')}</div>` +
      list.map(x => `<div class="card" onclick="App.selectTodoPlan(${x.id})">
        <div class="card-title">🔢 ${this.esc(x.plan_code)}</div>
        <div class="card-meta">
          ${x.title ? `<span>📋 ${this.esc(x.title)}</span>` : ''}
          ${x.project_ref ? `<span>🗂 ${this.esc(x.project_ref)}</span>` : ''}
          ${x.status ? `<span class="badge ${this.badgeClass(x.status)}">${this.esc(tr(x.status))}</span>` : ''}
        </div></div>`).join('') +
      `<div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.clearTodoPlan()">${tr('清除选择')}</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">${tr('取消')}</button>`;
    document.getElementById('modal-overlay').classList.add('show');
  };

  App.selectTodoPlan = function(id) {
    const x = (this.cache.tasks || []).find(r => String(r.id) === String(id));
    if (!x) return;
    this._todoPlan = { id: x.id, code: x.plan_code || '', title: x.title || '', project_id: x.project_id || '', project_ref: x.project_ref || '' };
    this.closeModal();
    this.updateTodoPlanButton();
  };

  App.clearTodoPlan = function() {
    this._todoPlan = null;
    this.closeModal();
    this.updateTodoPlanButton();
  };

  App.updateTodoPlanButton = function() {
    const btn = document.getElementById('todo-plan-btn');
    if (!btn) return;
    const label = this._todoPlan ? this._todoPlan.code : tr('项目计划编号（可选）');
    btn.innerHTML = `🔢 ${this.esc(label)}`;
  };

  /* ─── Materials Tab（物料：预警 / 物料主档 / 齐套 / 工厂库存 / 在途发货）─── */
  const MAT_TABS = [
    { key:'alerts',  icon:'🔔', label:'预警',     emptyKey:'暂无预警' },
    { key:'master',  icon:'🧾', label:'物料主档', module:'material_master',        emptyKey:'暂无物料主档' },
    { key:'kitting', icon:'🧩', label:'齐套',     module:'plan_material',          emptyKey:'暂无物料需求' },
    { key:'stock',   icon:'📦', label:'工厂库存', module:'factory_material_stock', emptyKey:'暂无库存' },
    { key:'transit', icon:'🚢', label:'在途发货', module:'material_shipment',      emptyKey:'暂无在途' },
  ];

  /* 海运时效基线（2026 行情）：印度门到门 18–45 天；越南北部陆运 4–6 天 / 海运 7–11 天。
   * 提前期与安全库存按工厂所在国分别配置 —— 越南厂备满一个月是超额压资金（在途只要 10 天）。 */
  App._matParams = function(factoryId, factoryName) {
    const f = (this.cache.factory_info || []).find(x => String(x.id) === String(factoryId));
    const txt = String((f && (f.country || f.region || f.factory_name)) || factoryName || '');
    return /印度|india/i.test(txt) ? { lead: 30, safety: 42 } : { lead: 10, safety: 21 };
  };

  App._matDaysTo = function(d) {
    if (!d) return null;
    const t = new Date(String(d).slice(0, 10) + 'T00:00:00');
    if (isNaN(t.getTime())) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  };

  // 齐套核心计算：可用量(现有-锁定) + 在途 vs 需求量
  App.computeMatKitting = function() {
    const stockBy = {}, transitBy = {};
    (this.cache.factory_material_stock || []).forEach(s => {
      const k = String(s.production_factory || s.factory_id || '') + '|' + String(s.material_code || '');
      if (!stockBy[k]) stockBy[k] = { onHand: 0, locked: 0, expiry: '', last: '' };
      stockBy[k].onHand += Number(s.qty_on_hand || 0);
      stockBy[k].locked += Number(s.qty_locked || 0);
      if (s.expiry_date && (!stockBy[k].expiry || s.expiry_date < stockBy[k].expiry)) stockBy[k].expiry = s.expiry_date;
      if (s.last_move_date && (!stockBy[k].last || s.last_move_date > stockBy[k].last)) stockBy[k].last = s.last_move_date;
    });
    (this.cache.material_shipment || []).forEach(sh => {
      if (sh.actual_arrival_date) return;
      const k = String(sh.production_factory || sh.factory_id || '') + '|' + String(sh.material_code || '');
      transitBy[k] = (transitBy[k] || 0) + Math.max(0, Number(sh.qty_shipped || 0) - Number(sh.qty_received || 0));
    });
    const items = (this.cache.plan_material || []).map(pm => {
      const k = String(pm.production_factory || pm.factory_id || '') + '|' + String(pm.material_code || '');
      const st = stockBy[k] || { onHand: 0, locked: 0 };
      const avail = Math.max(0, (st.onHand || 0) - (st.locked || 0));
      const transit = transitBy[k] || 0;
      const req = Number(pm.required_qty || 0);
      const gap = Math.max(0, req - avail - transit);
      const param = this._matParams(pm.factory_id, pm.production_factory);
      const safetyQty = req * (param.safety / 30);
      const days = this._matDaysTo(pm.required_date);
      let state = 'ok';
      if (gap > 0) state = 'gap';
      else if (avail + transit < safetyQty) state = 'low';
      return { pm, avail, transit, req, gap, state, days, safetyQty, param };
    });
    return { items, stockBy, transitBy };
  };

  // 预警：齐套缺口（要停线）/ 低库存（缓冲不足）/ 在途延迟 / 清关异常 / 呆滞料 / 保质期临期
  App.computeMaterialAlerts = function() {
    const out = [];
    const { items, stockBy } = this.computeMatKitting();
    items.forEach(it => {
      const pm = it.pm;
      if (it.state === 'gap' && it.days !== null && it.days <= it.param.lead) {
        out.push({ level:'critical', kind:tr('齐套缺口'),
          title:`${tr('料号')} ${this.esc(pm.material_code || '')} · ${tr('缺口')} ${it.gap}`,
          meta:`${tr('需求量')} ${it.req} / ${tr('可用量')} ${it.avail} / ${tr('在途')} ${it.transit}`,
          sub:`${this.esc(pm.plan_code || '')} ${pm.process_stage ? '· ' + this.esc(tr(pm.process_stage)) : ''} · ${tr('需求日')} ${this.esc(pm.required_date || '-')}` });
      } else if (it.state === 'low') {
        out.push({ level:'high', kind:tr('低库存'),
          title:`${tr('料号')} ${this.esc(pm.material_code || '')}`,
          meta:`${tr('可用量')} + ${tr('在途')} = ${it.avail + it.transit} < ${Math.round(it.safetyQty)}`,
          sub:`${this.esc(pm.plan_code || '')} · ${this.esc(pm.production_factory || '')}` });
      }
    });
    (this.cache.material_shipment || []).forEach(sh => {
      if (sh.actual_arrival_date) return;
      const d = this._matDaysTo(sh.eta_date);
      if (d !== null && d < 0) {
        out.push({ level:'critical', kind:tr('在途延迟'), title:`${this.esc(sh.lot_no || '')} ${this.esc(sh.material_code || '')}`,
          meta:`${tr('预计到厂日')} ${this.esc(sh.eta_date)}（${Math.abs(d)} 天）`, sub:this.esc(sh.production_factory || '') });
      }
      if (String(sh.customs_status) === '异常') {
        out.push({ level:'high', kind:tr('清关异常'), title:`${this.esc(sh.lot_no || '')}`,
          meta:`${tr('清关状态')} ${tr('异常')}`, sub:this.esc(sh.production_factory || '') });
      }
    });
    Object.keys(stockBy).forEach(k => {
      const st = stockBy[k];
      if (st.onHand <= 0) return;
      const parts = k.split('|');
      const code = parts.slice(1).join('|') || '';
      if (st.last) {
        const d = this._matDaysTo(st.last);
        if (d !== null && d <= -60) out.push({ level:'low', kind:tr('呆滞料'), title:`${this.esc(code)}`,
          meta:`${tr('最后异动日')} ${this.esc(st.last)}（${Math.abs(d)} 天）`, sub:this.esc(parts[0] || '') });
      }
      if (st.expiry) {
        const d = this._matDaysTo(st.expiry);
        if (d !== null && d <= 14) out.push({ level:'high', kind:tr('保质期临期'), title:`${this.esc(code)}`,
          meta:`${tr('到期日')} ${this.esc(st.expiry)}`, sub:this.esc(parts[0] || '') });
      }
    });
    return out;
  };

  App.setMatTab = function(key) { this._matTab = key; this.loadMaterials(); };

  App.loadMaterials = function() {
    this.updateAdminButtons();
    const tabKey = this._matTab || 'alerts';
    const tab = MAT_TABS.find(x => x.key === tabKey) || MAT_TABS[0];
    const tabsEl = document.getElementById('mat-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = MAT_TABS.map(x => `<div class="mat-tab ${x.key === tab.key ? 'active' : ''}" onclick="App.setMatTab('${x.key}')">${x.icon} ${tr(x.label)}</div>`).join('');
    }
    const titleEl = document.getElementById('mat-sec-title');
    if (titleEl) titleEl.textContent = `${tab.icon} ${tr(tab.label)}`;
    const addEl = document.getElementById('mat-add');
    if (addEl) addEl.style.display = tab.module ? '' : 'none';
    const impEl = document.getElementById('mat-import');
    if (impEl) impEl.style.display = tab.key === 'master' ? '' : 'none';
    if (impEl) impEl.textContent = tr('导入');
    if (tab.key === 'alerts') this.renderMatAlerts();
    else if (tab.key === 'kitting') this.renderMatKitting();
    else this.renderMatList(tab.module, tab.emptyKey);
    this.updateMatBadge();
  };

  App.renderMatAlerts = function() {
    const el = document.getElementById('mat-list');
    if (!el) return;
    const list = this.computeMaterialAlerts();
    if (!list.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">✅</div>${tr('暂无预警')}</div>`; return; }
    el.innerHTML = list.map(a => `<div class="card mat-alert-card ${a.level}">
      <div class="card-title">${a.kind} · ${a.title}</div>
      ${a.meta ? `<div class="card-meta"><span>${a.meta}</span></div>` : ''}
      ${a.sub ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">${a.sub}</div>` : ''}
    </div>`).join('');
  };

  App.renderMatList = function(moduleKey, emptyKey) {
    const el = document.getElementById('mat-list');
    if (!el) return;
    const mod = MODULES[moduleKey];
    const list = this.cache[moduleKey] || [];
    if (!list.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">${mod.icon || '📦'}</div>${tr(emptyKey || '暂无库存')}</div>`; return; }
    el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('${moduleKey}', ${r.id})">
      <div class="card-title">${mod.icon || ''} ${this.esc(mod.listFields.slice(0, 2).map(f => r[f.key] == null ? '' : r[f.key]).filter(v => v !== '').join(' · '))}</div>
      <div class="card-meta">${mod.listFields.slice(2).map(f => {
        const v = r[f.key];
        if (v === null || v === undefined || v === '') return '';
        return f.badge ? `<span class="badge ${this.badgeClass(v)}">${this.esc(tr(v))}</span>` : `<span>${this.esc(v)}</span>`;
      }).join('')}</div>
    </div>`).join('');
  };

  App.renderMatKitting = function() {
    const el = document.getElementById('mat-list');
    if (!el) return;
    const { items } = this.computeMatKitting();
    if (!items.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🧩</div>${tr('暂无物料需求')}</div>`; return; }
    const byPlan = {};
    items.forEach(it => { const k = it.pm.plan_code || '-'; (byPlan[k] = byPlan[k] || []).push(it); });
    el.innerHTML = Object.keys(byPlan).map(plan => {
      const rows = byPlan[plan];
      const ok = rows.filter(r => r.state === 'ok').length;
      const rate = rows.length ? Math.round(ok / rows.length * 100) : 0;
      const color = rate >= 100 ? 'var(--accent-green)' : rate >= 70 ? 'var(--accent-orange)' : '#ff3b30';
      return `<div class="card">
        <div class="card-title">🧩 ${this.esc(plan)} · ${tr('齐套率')} ${rate}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${rate}%;background:${color}"></div></div>
        ${rows.map(r => `<div onclick="App.openDetail('plan_material', ${r.pm.id})" style="display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-top:6px;color:${r.state === 'ok' ? 'var(--text-secondary)' : r.state === 'gap' ? '#ff3b30' : '#ff9500'}">
          <span>${this.esc(r.pm.material_code || '')} ${r.pm.process_stage ? '· ' + this.esc(tr(r.pm.process_stage)) : ''}</span>
          <span>${r.state === 'ok' ? 'OK' : tr('缺口') + ' ' + r.gap}</span>
        </div>`).join('')}
      </div>`;
    }).join('');
  };

  App.matAdd = function() {
    const tab = MAT_TABS.find(x => x.key === (this._matTab || 'alerts')) || {};
    if (!tab.module) return;
    this.showCreateFor(tab.module);
  };

  // BOM 批量导入：把 BOM 工程师导出的清单整段贴进来（料号,品名,规格,类别,单位,供应商）
  App.showMatImport = function() {
    const mc = document.getElementById('modal-content');
    if (!mc) return;
    mc.innerHTML = `<div class="modal-handle"></div>
      <div class="modal-title">${tr('批量导入')}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${tr('料号')},${tr('品名')},${tr('规格')},${tr('类别')},${tr('单位')},${tr('供应商')}</div>
      <textarea id="mat-import-text" style="width:100%;min-height:170px;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:13px"></textarea>
      <div style="height:10px"></div>
      <button class="btn btn-primary" onclick="App.doMatImport()">${tr('导入')}</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">${tr('取消')}</button>`;
    document.getElementById('modal-overlay').classList.add('show');
  };

  App.doMatImport = async function() {
    const txt = (document.getElementById('mat-import-text') || {}).value || '';
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) { this.toast(tr('料号') + ' ' + tr('不能为空')); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let n = 0;
    for (const line of lines) {
      const c = line.split(/[,\t]/).map(x => x.trim());
      if (!c[0]) continue;
      const id = this._newLocalId('material_master');
      const rec = { id, material_code: c[0], material_name: c[1] || '', spec: c[2] || '', category: c[3] || '', unit: c[4] || '', supplier: c[5] || '', origin: '中国发运', created_at: now, updated_at: now };
      (this.cache.material_master = this.cache.material_master || []).unshift(rec);
      try {
        await this.sbPost('sync_data', { table_name: 'material_master', local_id: id, payload: JSON.stringify(rec), supabase_id: this.uuid(), is_deleted: false, updated_at: new Date().toISOString(), device_id: this.deviceId });
      } catch (e) {}
      n++;
    }
    this.closeModal();
    this.toast(tr('导入') + ' ' + n);
    this.loadMaterials();
  };

  // 物料按钮角标（闪烁 ❗️）＋ 首页看板预警卡片
  App.updateMatBadge = function() {
    const n = (this.computeMaterialAlerts() || []).length;
    const badge = document.getElementById('mat-badge');
    if (badge) {
      if (n > 0) badge.classList.add('show'); else badge.classList.remove('show');
      badge.title = `${tr('物料预警')} ${n}`;
    }
    const home = document.getElementById('home-mat-alert');
    if (home) {
      home.innerHTML = n > 0
        ? `<div class="card" onclick="App.navigate('materials')" style="border-left:3px solid #ff3b30">
             <div class="card-title">❗️ ${tr('物料预警')} ${n}</div>
           </div>`
        : '';
    }
    return n;
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
        ${f.address ? `<span>🏠 ${this.esc(f.address)}</span>` : ''}
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
          ${p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(tr(p.status))}</span>` : ''}
        </div>
        <div class="prod-grid">
          ${p.order_no ? `<div class="prod-cell"><span class="prod-cell-label">${tr('订单号')}</span><span class="prod-cell-val">${this.esc(p.order_no)}</span></div>` : ''}
          ${p.delivery_date ? `<div class="prod-cell"><span class="prod-cell-label">${tr('计划交期')}</span><span class="prod-cell-val">${this.esc(p.delivery_date)}</span></div>` : ''}
          ${p.product_model ? `<div class="prod-cell"><span class="prod-cell-label">${tr('型号')}</span><span class="prod-cell-val">${this.esc(p.product_model)}</span></div>` : ''}
          ${p.quantity ? `<div class="prod-cell"><span class="prod-cell-label">${tr('数量')}</span><span class="prod-cell-val">${this.esc(p.quantity)}</span></div>` : ''}
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
      <div class="card-title">🔍 ${this.esc(r.unit ? tr(r.unit) : tr('客验'))}</div>
      <div class="card-meta">
        ${r.item ? `<span class="badge badge-cyan">${this.esc(tr(r.item))}</span>` : ''}
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
        ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(tr(i.severity))}</span>` : ''}
        ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(tr(i.status))}</span>` : ''}
        ${i.issue_type ? `<span class="badge badge-cyan">${this.esc(tr(i.issue_type))}</span>` : ''}
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
    if (issues.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>${tr(moduleKey === 'engineering' ? '工程问题' : '制程问题')}</div>`; return; }
    el.innerHTML = issues.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(i => `<div class="card" onclick="App.openDetail('${moduleKey}', ${i.id})">
      <div class="card-title">⚠️ ${this.esc(i.title)}</div>
      <div class="card-meta">
        ${i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(tr(i.severity))}</span>` : ''}
        ${i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(tr(i.status))}</span>` : ''}
        ${i.issue_type ? `<span class="badge badge-cyan">${this.esc(tr(i.issue_type))}</span>` : ''}
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
    const opts = `<option value="">${tr('（未选）')}</option>` + projects.map(p => `<option value="${this.esc(p.name)}">${this.esc(p.name)}</option>`).join('');
    const dp = document.getElementById('doa-project'); if (dp) dp.innerHTML = opts;
    const rp = document.getElementById('rma-project'); if (rp) rp.innerHTML = opts;

    const doa = (this.cache.doa || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const de = document.getElementById('doa-list');
    if (doa.length === 0) { de.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>${tr('暂无 DOA 记录')}</div>`; }
    else {
      de.innerHTML = doa.map(r => {
        const rate = (r.received_qty > 0) ? (r.defect_qty / r.received_qty * 100) : 0;
        return `<div class="card" onclick="App.openDetail('doa', ${r.id})">
          <div class="card-title">⚠️ ${this.esc(r.material_name || 'DOA')}</div>
          <div class="card-meta">
            ${r.date ? `<span>📅 ${this.esc(r.date)}</span>` : ''}
            ${r.factory ? `<span>🏭 ${this.esc(r.factory)}</span>` : ''}
            ${r.received_qty ? `<span>${tr('来料')} ${this.esc(r.received_qty)}</span>` : ''}
            ${r.defect_qty ? `<span>${tr('不良')} ${this.esc(r.defect_qty)}</span>` : ''}
            ${rate ? `<span class="badge badge-red">${tr('不良率')} ${rate.toFixed(1)}%</span>` : ''}
          </div></div>`;
      }).join('');
    }

    const rma = (this.cache.rma || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const re = document.getElementById('rma-list');
    if (rma.length === 0) { re.innerHTML = `<div class="empty"><div class="empty-icon">↩️</div>${tr('暂无 RMA 记录')}</div>`; }
    else {
      re.innerHTML = rma.map(r => `<div class="card" onclick="App.openDetail('rma', ${r.id})">
        <div class="card-title">↩️ ${this.esc(r.project || r.customer || 'RMA')}</div>
        <div class="card-meta">
          ${r.date ? `<span>📅 ${this.esc(r.date)}</span>` : ''}
          ${r.customer ? `<span>👤 ${this.esc(r.customer)}</span>` : ''}
          ${r.return_qty ? `<span>${tr('退')} ${this.esc(r.return_qty)}</span>` : ''}
          ${r.status ? `<span class="badge badge-${r.status === '已关闭' ? 'gray' : 'orange'}">${this.esc(tr(r.status))}</span>` : ''}
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
    if (list.length === 0) return `<div class="empty" style="padding:12px">${tr('暂无数据')}</div>`;
    const map = {};
    list.forEach(r => { const m = r.date.slice(0, 7); if (!map[m]) map[m] = { rec: 0, def: 0 }; map[m].rec += (+r.received_qty); map[m].def += (+r.defect_qty); });
    const months = Object.keys(map).sort();
    const values = months.map(m => +(map[m].def / map[m].rec * 100).toFixed(2));
    return this._trendChart(months, [{ name: tr('不良率') + ' %', color: '#e94560', values }]);
  };

  App._rmaTrend = function() {
    const list = (this.cache.rma || []).filter(r => r.date && r.return_qty > 0).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) return `<div class="empty" style="padding:12px">${tr('暂无数据')}</div>`;
    const map = {};
    list.forEach(r => { const m = r.date.slice(0, 7); map[m] = (map[m] || 0) + (+r.return_qty); });
    const months = Object.keys(map).sort();
    const values = months.map(m => map[m]);
    return this._trendChart(months, [{ name: tr('退货数量'), color: '#3b82f6', values }]);
  };

  App.saveDoa = async function() {
    const get = id => { const e = document.getElementById(id); return e ? (e.value || '').trim() : ''; };
    const material_name = get('doa-material_name');
    if (!material_name) { this.toast(tr('物料名不能为空')); return; }
    const now = new Date().toISOString();
    const id = this._newLocalId('doa');
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
      this.toast(tr('已保存 DOA'));
      this.loadInspection();
      ['doa-date', 'doa-project', 'doa-factory', 'doa-material_name', 'doa-material_batch', 'doa-received_qty', 'doa-defect_qty', 'doa-description', 'doa-internal_confirm'].forEach(id2 => { const e = document.getElementById(id2); if (e) e.value = ''; });
    } catch (e) { this.toast(tr('保存失败: ') + e.message); }
  };

  App.saveRma = async function() {
    const get = id => { const e = document.getElementById(id); return e ? (e.value || '').trim() : ''; };
    const project = get('rma-project');
    const customer = get('rma-customer');
    if (!project && !customer) { this.toast(tr('项目或客户至少填一项')); return; }
    const now = new Date().toISOString();
    const id = this._newLocalId('rma');
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
      this.toast(tr('已保存 RMA'));
      this.loadInspection();
      ['rma-date', 'rma-project', 'rma-customer', 'rma-return_qty', 'rma-reason', 'rma-status', 'rma-description'].forEach(id2 => { const e = document.getElementById(id2); if (e) e.value = ''; });
    } catch (e) { this.toast(tr('保存失败: ') + e.message); }
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
    this.renderPushSettings();
  };

  App.updateAdminButtons = function() {
    // 各「+ 新建」按钮按可见性显示：admin(含 admin2/3/4) 一律可见，UI 与超级管理员一致；
    // 实际写入在各自 handler 内由 canEdit() 拦截（仅超级管理员可保存）。
    const map = {
      'plan-task-add': this.isAdmin(),            // 计划任务
      'mat-alert-add': this.isAdmin(),            // 物料栏目
      'mat-factory-add': this.isAdmin(),          // 冗余占位（物料页无此钮）
      'factory-add': this.isAdmin(),              // 工厂讯息
      'qual-insp-add': this.isAdmin(),            // 品质(客验)
      'eng-add': this.isAdmin(),                  // 工程
      'fp-add': this.isAdmin(),                   // 制程
      'fieldlog-add': this.isAdmin(),             // 现场记录
      'kb-rebuild-btn': this.isSuperAdmin(),      // 重建知识库 → 仅超级管理员
    };
    Object.entries(map).forEach(([id, show]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? '' : 'none';
    });
  };

  /* ─── 通用模块列表搜索（page-module-list 的搜索框，index.html 直接调用）──── */
  App.renderModuleList = function() {
    const el = document.getElementById('module-list-content');
    if (!el) return;
    const qEl = document.getElementById('ml-search');
    const q = qEl ? (qEl.value || '').trim().toLowerCase() : '';
    const keys = Object.keys(MODULES).filter(k =>
      !q || (MODULES[k].title || k).toLowerCase().includes(q) || k.toLowerCase().includes(q)
    );
    if (!keys.length) { el.innerHTML = `<div class="empty">${tr('未找到匹配模块')}</div>`; return; }
    el.innerHTML = keys.map(k =>
      '<div class="ml-item" onclick="App.openModuleFromSearch(\'' + k + '\')">' +
        '<div class="ml-item-title">' + this.esc(tr(MODULES[k].title || k)) + '</div>' +
        '<div class="ml-item-sub">' + this.esc((this.cache[k] || []).length + ' ' + tr('条')) + '</div>' +
      '</div>'
    ).join('');
  };

  // 从模块搜索点击进入：有数据则打开首条详情，否则提示
  App.openModuleFromSearch = function(k) {
    const first = (this.cache[k] || [])[0];
    if (first && first.id != null) {
      this.pushPage('module-detail');
      this.currentModule = k;
      this.renderDetail(k, first.id);
    } else {
      this.toast(tr('该模块暂无可查看数据'));
    }
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
      // 强制硬刷新（绕过 HTTP 缓存）。iOS 主屏 PWA 下 location.href 带 ?t= 跳转常不触发重载，
      // 改用 reload(true) 更可靠；index.html 引用 bundle.js?v=N 随发版变化，不会命中旧缓存。
      window.location.reload(true);
    } catch (e) {
      window.location.reload(true);
    }
  };
}
