/* ═══ Reports (周/月报) ═══ */

export function setupReports(App) {
  App.rptType = 'weekly';

  App.switchReportType = function(type) {
    this.rptType = type;
    document.getElementById('rpt-tab-weekly').className = type === 'weekly' ? 'btn btn-primary' : 'btn btn-secondary';
    document.getElementById('rpt-tab-monthly').className = type === 'monthly' ? 'btn btn-primary' : 'btn btn-secondary';
    if (document.getElementById('rpt-from').value && document.getElementById('rpt-to').value) {
      this.generateReport();
    }
  };

  App.quickDateRange = function(range) {
    const now = new Date();
    if (range === 'week') {
      const day = now.getDay() || 7;
      const monday = new Date(now); monday.setDate(now.getDate() - day + 1);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      document.getElementById('rpt-from').value = monday.toISOString().slice(0, 10);
      document.getElementById('rpt-to').value = sunday.toISOString().slice(0, 10);
    } else if (range === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      document.getElementById('rpt-from').value = first.toISOString().slice(0, 10);
      document.getElementById('rpt-to').value = last.toISOString().slice(0, 10);
    }
    this.generateReport();
  };

  App.loadReports = function() {
    if (!document.getElementById('rpt-from').value) {
      if (this.rptType === 'weekly') {
        this.quickDateRange('week');
      } else {
        this.quickDateRange('month');
      }
    } else {
      this.generateReport();
    }
  };

  App.generateReport = function() {
    const from = document.getElementById('rpt-from').value;
    const to = document.getElementById('rpt-to').value;
    if (!from || !to) { this.toast('请选择日期区间'); return; }

    const el = document.getElementById('rpt-content');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>生成报告中...</div>';

    const projects = this.cache.projects || [];
    const issues = this.cache.issues || [];
    const shipping = this.cache.shipping_plans || [];
    const tasks = this.cache.tasks || [];

    const inRange = (d) => {
      if (!d) return false;
      return d >= from && d <= to + 'T23:59:59';
    };
    const projInPeriod = projects.filter(p => inRange(p.updated_at) || inRange(p.created_at) || inRange(p.start_date) || inRange(p.delivery_date));
    const issuesInPeriod = issues.filter(i => inRange(i.created_at) || inRange(i.updated_at));
    const shipInPeriod = shipping.filter(s => inRange(s.planned_ship_date) || inRange(s.created_at) || inRange(s.updated_at));
    const tasksInPeriod = tasks.filter(t => inRange(t.created_at) || inRange(t.updated_at) || inRange(t.due_date));

    const issueOpen = issuesInPeriod.filter(i => !['closed', 'resolved'].includes(i.status)).length;
    const issueClosed = issuesInPeriod.filter(i => ['closed', 'resolved'].includes(i.status)).length;
    const issueCritical = issuesInPeriod.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    const shipPending = shipInPeriod.filter(s => !['shipped', 'delivered'].includes(s.status)).length;
    const shipDone = shipInPeriod.filter(s => ['shipped', 'delivered'].includes(s.status)).length;
    const taskDone = tasksInPeriod.filter(t => t.status === 'done' || t.status === 'completed').length;
    const taskPending = tasksInPeriod.filter(t => t.status !== 'done' && t.status !== 'completed').length;

    const typeLabel = this.rptType === 'weekly' ? '周报' : '月报';
    const now = new Date();
    const genTime = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    let html = '';

    html += `<div class="card" style="text-align:center;border:1px solid var(--accent)">
      <div style="font-size:18px;font-weight:700;color:var(--accent)">📊 PMApp ${typeLabel}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${from} 至 ${to}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">生成时间: ${genTime}</div>
    </div>`;

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 10px">';
    html += `<div class="card" style="margin:0;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--accent-blue)">${projInPeriod.length}</div><div style="font-size:11px;color:var(--text-secondary)">活跃项目</div></div>`;
    html += `<div class="card" style="margin:0;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--accent)">${issuesInPeriod.length}</div><div style="font-size:11px;color:var(--text-secondary)">问题总数</div></div>`;
    html += `<div class="card" style="margin:0;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--accent-orange)">${shipInPeriod.length}</div><div style="font-size:11px;color:var(--text-secondary)">出货计划</div></div>`;
    html += `<div class="card" style="margin:0;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--accent-green)">${taskDone}/${tasksInPeriod.length}</div><div style="font-size:11px;color:var(--text-secondary)">任务完成</div></div>`;
    html += '</div>';

    html += '<div class="sec-header"><span>问题状态</span></div>';
    html += '<div style="padding:0 12px 10px">';
    html += `<div class="card" style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--accent)">待处理/进行中</span><span style="font-weight:700">${issueOpen}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--accent-green)">已关闭</span><span style="font-weight:700">${issueClosed}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--accent-orange)">严重/高优先级</span><span style="font-weight:700">${issueCritical}</span></div>
    </div>`;
    html += '</div>';

    html += '<div class="sec-header"><span>出货状态</span></div>';
    html += '<div style="padding:0 12px 10px">';
    html += `<div class="card" style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--accent-orange)">待出货</span><span style="font-weight:700">${shipPending}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--accent-green)">已出货</span><span style="font-weight:700">${shipDone}</span></div>
    </div>`;
    html += '</div>';

    if (projInPeriod.length > 0) {
      html += '<div class="sec-header"><span>活跃项目</span></div>';
      html += '<div style="padding:0 12px 10px">';
      projInPeriod.slice(0, 10).forEach(p => {
        const statusBadge = p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(p.status)}</span>` : '';
        const stage = p.stage ? `<span class="badge badge-blue">${this.esc(p.stage)}</span>` : '';
        const dd = p.delivery_date ? `<span>📅 ${this.esc(p.delivery_date)}</span>` : '';
        html += `<div class="card" onclick="App.openDetail('projects', ${p.id})">
          <div class="card-title">${this.esc(p.name || '未命名')}</div>
          <div class="card-meta">${statusBadge} ${stage} ${dd}</div>
        </div>`;
      });
      if (projInPeriod.length > 10) {
        html += `<div style="text-align:center;padding:8px;color:var(--text-muted);font-size:12px">还有 ${projInPeriod.length - 10} 个项目...</div>`;
      }
      html += '</div>';
    }

    if (issuesInPeriod.length > 0) {
      html += '<div class="sec-header"><span>问题列表</span></div>';
      html += '<div style="padding:0 12px 10px">';
      issuesInPeriod.slice(0, 10).forEach(i => {
        const sevBadge = i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : '';
        const stBadge = i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : '';
        const assignee = i.assigned_to ? `<span>👤 ${this.esc(i.assigned_to)}</span>` : '';
        html += `<div class="card" onclick="App.openDetail('issues', ${i.id})">
          <div class="card-title">⚠️ ${this.esc(i.title || '无标题')}</div>
          <div class="card-meta">${sevBadge} ${stBadge} ${assignee}</div>
        </div>`;
      });
      if (issuesInPeriod.length > 10) {
        html += `<div style="text-align:center;padding:8px;color:var(--text-muted);font-size:12px">还有 ${issuesInPeriod.length - 10} 个问题...</div>`;
      }
      html += '</div>';
    }

    if (shipInPeriod.length > 0) {
      html += '<div class="sec-header"><span>出货计划</span></div>';
      html += '<div style="padding:0 12px 10px">';
      shipInPeriod.slice(0, 10).forEach(s => {
        const stBadge = s.status ? `<span class="badge ${this.badgeClass(s.status)}">${this.esc(s.status)}</span>` : '';
        const dest = s.destination ? `<span>📍 ${this.esc(s.destination)}</span>` : '';
        const date = s.planned_ship_date ? `<span>📅 ${this.esc(s.planned_ship_date)}</span>` : '';
        html += `<div class="card" onclick="App.openDetail('shipping_plans', ${s.id})">
          <div class="card-title">🚢 ${this.esc(s.plan_no || '未编号')}</div>
          <div class="card-meta">${stBadge} ${dest} ${date}</div>
        </div>`;
      });
      if (shipInPeriod.length > 10) {
        html += `<div style="text-align:center;padding:8px;color:var(--text-muted);font-size:12px">还有 ${shipInPeriod.length - 10} 条出货...</div>`;
      }
      html += '</div>';
    }

    if (projInPeriod.length === 0 && issuesInPeriod.length === 0 && shipInPeriod.length === 0 && tasksInPeriod.length === 0) {
      html = `<div class="card" style="text-align:center;border:1px solid var(--accent)">
        <div style="font-size:18px;font-weight:700;color:var(--accent)">📊 PMApp ${typeLabel}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${from} 至 ${to}</div>
      </div>
      <div class="empty"><div class="empty-icon">📭</div>该时段内暂无数据</div>`;
    }

    el.innerHTML = html;
  };
}
