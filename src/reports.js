/* ═══ Reports (周/月报) ═══ */

export function setupReports(App) {
  // ── 填充项目下拉（周报 + 月报）──
  App.populateReportProjects = function() {
    const projects = this.cache.projects || [];
    ['weekly', 'monthly'].forEach(type => {
      const sel = document.getElementById('rpt-' + type + '-project');
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="all">' + t('rpt_all_projects') + '</option>' +
        projects.map(p => `<option value="${p.id}">${this.esc(p.name || ('项目' + p.id))}</option>`).join('');
      if (cur) sel.value = cur;
    });
  };

  // ── 选了开始日期 → 自动算截止（7天/30天），并反灰禁用 ──
  App.onReportStartChange = function(type) {
    const fromEl = document.getElementById('rpt-' + type + '-from');
    const toEl = document.getElementById('rpt-' + type + '-to');
    if (!fromEl.value) { toEl.value = ''; return; }
    const span = type === 'weekly' ? 6 : 29; // 含起点共 7 / 30 天
    const d = new Date(fromEl.value + 'T00:00:00');
    d.setDate(d.getDate() + span);
    toEl.value = d.toISOString().slice(0, 10);
  };

  App.loadReports = function() {
    this.populateReportProjects();
    const now = new Date();
    const dow = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - dow + 1);
    const wfrom = mon.toISOString().slice(0, 10);
    const mfrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const wf = document.getElementById('rpt-weekly-from');
    const mf = document.getElementById('rpt-monthly-from');
    if (wf && !wf.value) { wf.value = wfrom; this.onReportStartChange('weekly'); }
    if (mf && !mf.value) { mf.value = mfrom; this.onReportStartChange('monthly'); }
    this.loadMeetings && this.loadMeetings();
  };

  // ── 点击生成按钮：弹窗展示报告 ──
  App.generateReport = function(type) {
    const from = document.getElementById('rpt-' + type + '-from').value;
    const to = document.getElementById('rpt-' + type + '-to').value;
    const sel = document.getElementById('rpt-' + type + '-project').value;
    if (!from || !to) { this.toast(t('rpt_pick_start')); return; }
    const html = this.buildReportHTML(type, from, to, sel);
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
  };

  // ── 日期工具 ──
  const dayOf = (s) => (s || '').slice(0, 10);
  const inRange = (s, from, to) => { const d = dayOf(s); return d >= from && d <= to; };
  const eachDay = (from, to) => {
    const out = []; const d = new Date(from + 'T00:00:00'); const e = new Date(to + 'T00:00:00');
    while (d <= e) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
    return out;
  };

  // ── 报告主构建 ──
  App.buildReportHTML = function(type, from, to, projectSel) {
    const isWeek = type === 'weekly';
    const typeLabel = isWeek ? t('rpt_weekly_title') : t('rpt_monthly_title');
    const projects = this.cache.projects || [];
    const issues = this.cache.issues || [];
    const shipping = this.cache.shipping_plans || [];
    const tasks = this.cache.tasks || [];
    const alerts = this.cache.overseas_material_alerts || [];
    const factories = this.cache.factory_info || [];

    const scoped = projectSel && projectSel !== 'all' ? projects.filter(p => String(p.id) === String(projectSel)) : projects;
    const projectName = scoped.length === 1 ? (scoped[0].name || ('项目' + scoped[0].id)) : t('rpt_all_projects');
    const scopeNote = (projectSel && projectSel !== 'all') ? `<div class="rpt-sub">${t('rpt_scope_note')}</div>` : '';

    const projIn = scoped.filter(p => inRange(p.updated_at, from, to) || inRange(p.created_at, from, to) || inRange(p.start_date, from, to) || inRange(p.delivery_date, from, to));
    const issuesIn = issues.filter(i => inRange(i.created_at, from, to) || inRange(i.updated_at, from, to));
    const shipIn = shipping.filter(s => inRange(s.planned_ship_date, from, to) || inRange(s.created_at, from, to) || inRange(s.updated_at, from, to));
    const tasksIn = tasks.filter(t2 => inRange(t2.created_at, from, to) || inRange(t2.updated_at, from, to) || inRange(t2.due_date, from, to));

    const days = eachDay(from, to);
    const dayLabels = days.map(d => d.slice(5));
    const perDay = (arr, typeSet) => days.map(d => arr.filter(i => typeSet.includes(i.issue_type) && dayOf(i.created_at) === d).length);

    const incomingSet = ['quality', 'supply'];
    const processSet = ['production'];
    const iqcSet = ['quality', 'supply', 'inspection'];
    const oqcSet = ['inspection'];

    const incomingSeries = perDay(issuesIn, incomingSet);
    const processSeries = perDay(issuesIn, processSet);
    const iqcSeries = perDay(issuesIn, iqcSet);
    const oqcSeries = perDay(issuesIn, oqcSet);

    const now = new Date();
    const genTime = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    const C = { blue: '#3b82f6', green: '#22c55e', orange: '#f59e0b', red: '#ef4444', purple: '#a855f7' };

    let h = '';
    // 头部
    h += `<div class="rpt-doc">
      <div class="rpt-h" style="margin-top:0">${typeLabel}</div>
      <div class="rpt-sub">${t('rpt_project')}：<b>${this.esc(projectName)}</b></div>
      <div class="rpt-sub">${t('rpt_period')}：${from} ~ ${to}</div>
      <div class="rpt-sub" style="color:var(--text-muted)">${t('rpt_gen_time')}：${genTime}</div>
      ${scopeNote}

      <div class="rpt-h">${t('rpt_summary')}</div>
      ${this._rptStatGrid([
        { v: projIn.length, l: t('rpt_active_projects'), c: C.blue },
        { v: tasksIn.filter(t2 => t2.status === 'done' || t2.status === 'completed').length + '/' + tasksIn.length, l: t('rpt_tasks_done'), c: C.green },
        { v: issuesIn.length, l: t('rpt_issues'), c: C.orange },
        { v: shipIn.length, l: t('rpt_ship_plans'), c: C.purple },
      ])}
      ${projIn.length ? `<div style="margin:6px 0">${projIn.slice(0, 8).map(p => {
        const st = p.status ? `<span class="badge ${this.badgeClass(p.status)}">${this.esc(p.status)}</span>` : '';
        const dd = p.delivery_date ? `<span style="color:var(--text-secondary)">📅 ${this.esc(p.delivery_date)}</span>` : '';
        return `<div class="rpt-row"><span>${this.esc(p.name || '未命名')}</span><span>${st} ${dd}</span></div>`;
      }).join('')}</div>` : `<div class="rpt-empty">${t('rpt_no_project')}</div>`}

      <div class="rpt-h">${t('rpt_material')}</div>
      ${(alerts.length || factories.length) ? `
        <div class="rpt-sub">${t('rpt_alert_enabled')}：${alerts.filter(a => a.is_enabled).length} / ${alerts.length}</div>
        ${alerts.slice(0, 6).map(a => `<div class="rpt-row"><span>${this.esc(a.rule_name || '-')}</span><span>${this.esc(a.threshold_value || '-')}</span></div>`).join('')}
        ${factories.filter(f => f.daily_production_report).slice(0, 4).map(f => `<div class="rpt-row"><span>🏭 ${this.esc(f.factory_name || '-')}</span><span><a href="${this.esc(f.daily_production_report)}" target="_blank" style="color:var(--accent-blue)">${t('rpt_daily_link')}</a></span></div>`).join('')}
      ` : `<div class="rpt-empty">${t('rpt_no_material')}</div>`}

      <div class="rpt-h">${t('rpt_problems')}</div>
      ${this._rptBar([
        { label: t('rpt_type_quality'), value: issuesIn.filter(i => i.issue_type === 'quality').length, color: C.red },
        { label: t('rpt_type_production'), value: issuesIn.filter(i => i.issue_type === 'production').length, color: C.orange },
        { label: t('rpt_type_supply'), value: issuesIn.filter(i => i.issue_type === 'supply').length, color: C.purple },
        { label: t('rpt_type_inspection'), value: issuesIn.filter(i => i.issue_type === 'inspection').length, color: C.blue },
        { label: t('rpt_type_other'), value: issuesIn.filter(i => !['quality', 'production', 'supply', 'inspection'].includes(i.issue_type)).length, color: '#64748b' },
      ])}
      <div class="rpt-sub">${t('rpt_open')}：${issuesIn.filter(i => !['closed', 'resolved'].includes(i.status)).length} ｜ ${t('rpt_critical')}：${issuesIn.filter(i => i.severity === 'critical' || i.severity === 'high').length}</div>
      ${issuesIn.length ? `<div style="margin:6px 0">${issuesIn.slice(0, 6).map(i => {
        const sev = i.severity ? `<span class="badge ${this.badgeClass(i.severity)}">${this.esc(i.severity)}</span>` : '';
        const st = i.status ? `<span class="badge ${this.badgeClass(i.status)}">${this.esc(i.status)}</span>` : '';
        return `<div class="rpt-row"><span>⚠️ ${this.esc(i.title || '无标题')}</span><span>${sev}${st}</span></div>`;
      }).join('')}</div>` : `<div class="rpt-empty">${t('rpt_no_issue')}</div>`}

      <div class="rpt-h">${t('rpt_defect')}</div>
      <div class="rpt-chart">${this._rptLine(dayLabels, [
        { name: t('rpt_incoming'), color: C.red, values: incomingSeries },
        { name: t('rpt_process'), color: C.orange, values: processSeries },
      ])}</div>
      ${this._rptDefectTable(days, incomingSeries, processSeries)}

      <div class="rpt-h">${t('rpt_iqc_oqc')}</div>
      <div class="rpt-chart">${this._rptLine(dayLabels, [
        { name: 'IQC', color: C.blue, values: iqcSeries },
        { name: 'OQC', color: C.green, values: oqcSeries },
      ])}</div>
      ${this._rptIQCTable(days, iqcSeries, oqcSeries)}

      <div class="rpt-h">${t('rpt_shipment')}</div>
      ${shipIn.length ? `
        <table>
          <thead><tr><th>${t('rpt_plan_no')}</th><th>${t('rpt_dest')}</th><th>${t('rpt_ship_date')}</th><th>${t('rpt_status')}</th></tr></thead>
          <tbody>${shipIn.slice(0, 12).map(s => `<tr>
            <td>${this.esc(s.plan_no || '-')}</td>
            <td>${this.esc(s.destination || '-')}</td>
            <td>${this.esc(s.planned_ship_date || '-')}</td>
            <td><span class="badge ${this.badgeClass(s.status)}">${this.esc(s.status || '-')}</span></td>
          </tr>`).join('')}</tbody>
        </table>
        <div class="rpt-sub">${t('rpt_shipped')}：${shipIn.filter(s => ['shipped', 'delivered'].includes(s.status)).length} ｜ ${t('rpt_pending')}：${shipIn.filter(s => !['shipped', 'delivered'].includes(s.status)).length}</div>
      ` : `<div class="rpt-empty">${t('rpt_no_ship')}</div>`}

      <div class="rpt-disclaimer">${t('rpt_disclaimer')}</div>
      <button class="btn btn-secondary" style="width:100%;margin-top:14px" onclick="App.closeModal({target:{id:'modal-overlay'}})">${t('btn_close')}</button>
    </div>`;
    return h;
  };

  // ── SVG 折线图 ──
  App._rptLine = function(labels, series) {
    const W = 320, H = 150, pl = 26, pr = 8, pt = 16, pb = 22;
    const cw = W - pl - pr, ch = H - pt - pb;
    let maxY = 1; series.forEach(s => s.values.forEach(v => { if (v > maxY) maxY = v; }));
    maxY = Math.ceil(maxY / 2) * 2; if (maxY < 2) maxY = 2;
    const n = labels.length;
    const xOf = i => pl + (n <= 1 ? cw / 2 : cw * i / (n - 1));
    const yOf = v => pt + ch - (v / maxY) * ch;
    let grid = '';
    for (let k = 0; k <= 4; k++) { const y = pt + ch * k / 4; grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="#334155" stroke-width="1"/>`; }
    const step = Math.max(1, Math.floor(n / 5));
    let xlab = '';
    for (let i = 0; i < n; i += step) xlab += `<text x="${xOf(i)}" y="${H - 6}" fill="#94a3b8" font-size="9" text-anchor="middle">${labels[i]}</text>`;
    let lines = '';
    series.forEach(s => {
      const pts = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
      lines += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
      s.values.forEach((v, i) => { lines += `<circle cx="${xOf(i)}" cy="${yOf(v)}" r="2" fill="${s.color}"/>`; });
    });
    let lx = pl, legend = '';
    series.forEach(s => { legend += `<rect x="${lx}" y="3" width="8" height="8" fill="${s.color}"/><text x="${lx + 11}" y="11" fill="#cbd5e1" font-size="9">${s.name}</text>`; lx += 11 + s.name.length * 6 + 10; });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}${xlab}${lines}${legend}</svg>`;
  };

  // ── SVG 柱状图 ──
  App._rptBar = function(items) {
    const W = 320, H = 150, pl = 8, pr = 8, pt = 14, pb = 26;
    const cw = W - pl - pr, ch = H - pt - pb;
    const maxV = Math.max(1, ...items.map(i => i.value));
    const n = items.length || 1;
    const bw = Math.min(46, cw / n * 0.7);
    const gap = (cw - bw * n) / (n + 1);
    let bars = `<line x1="${pl}" y1="${pt + ch}" x2="${W - pr}" y2="${pt + ch}" stroke="#334155"/>`;
    items.forEach((it, idx) => {
      const x = pl + gap + (bw + gap) * idx;
      const hh = ch * (it.value / maxV);
      const y = pt + ch - hh;
      bars += `<rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="3" fill="${it.color || '#3b82f6'}"/>`;
      bars += `<text x="${x + bw / 2}" y="${y - 3}" fill="#cbd5e1" font-size="9" text-anchor="middle">${it.value}</text>`;
      bars += `<text x="${x + bw / 2}" y="${H - 8}" fill="#94a3b8" font-size="9" text-anchor="middle">${it.label}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${bars}</svg>`;
  };

  App._rptStatGrid = function(stats) {
    return `<div class="rpt-stats">${stats.map(s => `<div class="rpt-stat"><div class="v" style="color:${s.c}">${s.v}</div><div class="l">${s.l}</div></div>`).join('')}</div>`;
  };

  App._rptDefectTable = function(days, incoming, process) {
    let rows = '';
    days.forEach((d, i) => { rows += `<tr><td>${d}</td><td>${incoming[i]}</td><td>${process[i]}</td><td>${incoming[i] + process[i]}</td></tr>`; });
    return `<table><thead><tr><th>${t('rpt_date')}</th><th>${t('rpt_incoming')}</th><th>${t('rpt_process')}</th><th>${t('rpt_total')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  App._rptIQCTable = function(days, iqc, oqc) {
    let rows = '';
    days.forEach((d, i) => { rows += `<tr><td>${d}</td><td>${iqc[i]}</td><td>${oqc[i]}</td><td>${iqc[i] + oqc[i]}</td></tr>`; });
    return `<table><thead><tr><th>${t('rpt_date')}</th><th>IQC</th><th>OQC</th><th>${t('rpt_total')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
}
