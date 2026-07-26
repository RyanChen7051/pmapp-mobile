/* ═══ Detail Pages: Project Detail + Generic Detail ═══ */
import { MODULES, STAGE_PROGRESS } from './config.js';

export function setupDetail(App) {
  /* ─── Project Detail ─── */
  App.openProjectDetail = function(id) {
    this.pageStack.push(this.currentPage);
    const projects = this.cache.projects || [];
    const project = projects.find(p => p.id === id);
    if (!project) { this.toast('项目不存在'); return; }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-project-detail').classList.add('active');
    document.getElementById('tb-title').textContent = project.name || '项目详情';
    document.getElementById('tb-back').style.display = 'block';
    document.getElementById('tb-action').innerHTML = '';
    document.getElementById('fab').style.display = 'none';
    if (this.isAdmin()) {
      document.getElementById('tb-action').innerHTML = `<span onclick="App.showEditFor('projects', ${id})">编辑</span>`;
    }
    this.currentPage = 'project-detail';
    this.currentModule = 'projects';
    this.currentRecordId = id;
    this.renderProjectDetail(project);
    window.scrollTo(0, 0);
  };

  App.renderProjectDetail = function(p) {
    const issues = (this.cache.issues || []).filter(i => i.project_id === p.id || (p.name && i.title && i.title.includes(p.name)));
    const inspections = issues.filter(i => i.issue_type === 'inspection');
    const shipping = (this.cache.shipping_plans || []).filter(s => s.plan_no && p.order_no && s.plan_no.includes(p.order_no));
    const progress = STAGE_PROGRESS[p.stage] || (p.status === 'completed' ? 100 : 0);
    const pColor = progress >= 75 ? 'var(--accent-green)' : progress >= 50 ? 'var(--accent-orange)' : 'var(--accent-blue)';

    let html = `<div class="card"><div class="card-title" style="font-size:17px">📦 ${this.esc(p.name)}</div>
      <div class="card-meta">
        ${p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(p.status)}</span>` : ''}
        ${p.stage ? `<span class="badge badge-purple">${this.esc(p.stage)}</span>` : ''}
        ${p.customer_name_zh ? `<span>👤 ${this.esc(p.customer_name_zh)}</span>` : ''}
      </div></div>`;

    html += `<div class="card">
      <div class="card-title">📊 生产进度</div>
      <div class="progress-bar" style="height:10px;margin:8px 0"><div class="progress-fill" style="width:${progress}%;background:${pColor}"></div></div>
      <div style="font-size:12px;color:var(--text-secondary);text-align:right">${progress}%</div>
      <div class="detail-sec" style="margin-top:8px">
        ${p.start_date ? `<div class="detail-label">开始日期</div><div class="detail-val">${this.esc(p.start_date)}</div>` : ''}
        ${p.end_date ? `<div class="detail-label">结束日期</div><div class="detail-val">${this.esc(p.end_date)}</div>` : ''}
        ${p.quantity ? `<div class="detail-label">生产数量</div><div class="detail-val">${this.esc(p.quantity)}</div>` : ''}
        ${p.product_model ? `<div class="detail-label">产品型号</div><div class="detail-val">${this.esc(p.product_model)}</div>` : ''}
      </div></div>`;

    html += `<div class="card">
      <div class="card-title">⚠️ 问题数量 (${issues.length})</div>`;
    if (issues.length === 0) {
      html += '<div class="empty" style="padding:16px">暂无问题</div>';
    } else {
      html += issues.slice(0, 5).map(i => `<div class="list-item" onclick="App.openDetail('issues', ${i.id})">
        <span class="list-item-icon">${i.status === 'closed' ? '✅' : '⚠️'}</span>
        <div class="list-item-content"><div class="list-item-title">${this.esc(i.title)}</div>
        <div class="list-item-sub">${i.severity ? this.esc(i.severity) : ''} ${i.status ? '· ' + this.esc(i.status) : ''}</div></div></div>`).join('');
    }
    html += '</div>';

    html += `<div class="card">
      <div class="card-title">🔍 检验计划 (${inspections.length})</div>`;
    if (inspections.length === 0) {
      html += '<div class="empty" style="padding:16px">暂无检验问题</div>';
    } else {
      html += inspections.slice(0, 5).map(i => `<div class="list-item" onclick="App.openDetail('issues', ${i.id})">
        <span class="list-item-icon">🔍</span>
        <div class="list-item-content"><div class="list-item-title">${this.esc(i.title)}</div>
        <div class="list-item-sub">${i.severity ? this.esc(i.severity) : ''} ${i.status ? '· ' + this.esc(i.status) : ''}</div></div></div>`).join('');
    }
    html += '</div>';

    html += `<div class="card">
      <div class="card-title">🚚 交付计划</div>
      <div class="detail-sec">
        ${p.delivery_date ? `<div class="detail-label">交货日期</div><div class="detail-val">${this.esc(p.delivery_date)}</div>` : ''}
        ${p.customer_name_en ? `<div class="detail-label">客户(英)</div><div class="detail-val">${this.esc(p.customer_name_en)}</div>` : ''}
        ${p.order_no ? `<div class="detail-label">订单号</div><div class="detail-val">${this.esc(p.order_no)}</div>` : ''}
      </div>`;
    if (shipping.length > 0) {
      html += '<div class="detail-label">出货计划</div>';
      html += shipping.map(s => `<div class="list-item" onclick="App.openDetail('shipping_plans', ${s.id})">
        <span class="list-item-icon">🚢</span>
        <div class="list-item-content"><div class="list-item-title">${this.esc(s.plan_no)}</div>
        <div class="list-item-sub">${s.destination ? this.esc(s.destination) : ''} ${s.planned_ship_date ? '· ' + this.esc(s.planned_ship_date) : ''}</div></div></div>`).join('');
    }
    html += '</div>';

    document.getElementById('project-detail-content').innerHTML = html;
  };

  /* ─── Generic Detail ─── */
  App.openDetail = function(moduleKey, id) {
    this.pageStack.push(this.currentPage);
    const mod = MODULES[moduleKey];
    if (!mod) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-module-detail').classList.add('active');
    document.getElementById('tb-title').textContent = mod.title + '详情';
    document.getElementById('tb-back').style.display = 'block';
    document.getElementById('tb-action').innerHTML = '';
    document.getElementById('fab').style.display = 'none';
    if (this.isAdmin() && mod.editFields) {
      document.getElementById('tb-action').innerHTML = `<span onclick="App.showEditFor('${moduleKey}', ${id})">编辑</span>`;
    }
    this.currentPage = 'module-detail';
    this.currentModule = moduleKey;
    this.currentRecordId = id;
    this.renderDetail(moduleKey, id);
    window.scrollTo(0, 0);
  };

  App.renderDetail = function(moduleKey, id) {
    const mod = MODULES[moduleKey];
    const records = this.cache[moduleKey] || [];
    const record = records.find(r => r.id === id);
    const el = document.getElementById('module-detail-content');
    if (!record) { el.innerHTML = '<div class="empty">记录不存在</div>'; return; }
    let html = `<div class="card"><div class="card-title" style="font-size:17px">${mod.icon} `;
    html += this.esc(record[mod.detailFields[0].key] || mod.title + ' #' + id);
    html += '</div></div><div class="card">';
    mod.detailFields.forEach(f => {
      const val = record[f.key];
      if (val === null || val === undefined || val === '') return;
      html += `<div class="detail-sec"><div class="detail-label">${this.esc(f.label)}</div>`;
      if (typeof val === 'string' && val.startsWith('http')) {
        html += `<div class="detail-val"><a href="${this.esc(val)}" style="color:var(--accent-blue)" target="_blank">${this.esc(val)}</a></div>`;
      } else {
        html += `<div class="detail-val">${this.esc(val)}</div>`;
      }
      html += '</div>';
    });
    html += '</div>';
    if (moduleKey === 'ai_industry_news' && record.url) {
      html += `<a href="${this.esc(record.url)}" target="_blank" style="display:block;text-align:center;padding:12px;margin:8px 0;background:var(--accent);color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">查看原文 ↗</a>`;
    }
    if (moduleKey === 'projects') {
      const issues = (this.cache.issues || []).filter(i => i.project_id === id);
      const tasks = (this.cache.tasks || []).filter(t => t.project_id === id);
      html += `<div class="sec-header"><span>任务 (${tasks.length})</span></div>`;
      if (tasks.length === 0) html += '<div class="empty">暂无任务</div>';
      else html += tasks.map(t => `<div class="list-item" onclick="App.openDetail('tasks', ${t.id})"><span class="list-item-icon">${t.status === 'done' ? '✅' : '📋'}</span><div class="list-item-content"><div class="list-item-title">${this.esc(t.title)}</div><div class="list-item-sub">${this.esc(t.priority || '')} ${t.assignee ? '· ' + this.esc(t.assignee) : ''}</div></div></div>`).join('');
      html += `<div class="sec-header"><span>问题 (${issues.length})</span></div>`;
      if (issues.length === 0) html += '<div class="empty">暂无问题</div>';
      else html += issues.map(i => `<div class="card" onclick="App.openDetail('issues', ${i.id})"><div class="card-title">${this.esc(i.title)}</div><div class="card-meta"><span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span><span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span></div></div>`).join('');
    }
    el.innerHTML = html;
  };
}
