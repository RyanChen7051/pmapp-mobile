/* ═══ 领导驾驶舱（简洁 4 KPI 版）═══
 * 设计稿 home_redesign_mockup.html 要求：4 个简单 KPI（进行中项目/待处理问题/
 * 本周出货/缺陷率），一行 4 列，置顶。删除图表/明细表/AI 解读/筛选条，
 * 让首页更简洁，模块入口留给快捷宫格。
 * 数据源：App.cache（projects/issues/shipping_plans/doa）。
 */
import { tr } from './i18n.js';
export function setupCockpit(App) {
  App.renderCockpit = function () {
    const el = document.getElementById('cockpit');
    if (!el) return;

    const C = this.cache || {};
    const issues = C.issues || [];
    const doa = C.doa || [];

    // KPI 1: 进行中项目
    // 桥接后桌面 projects 与 PWA 项目讯息 project_info 同源（云端均为 project_info），
    // 此处合并两者、按 id 去重后统计 status === 'active'（进行中）。
    const _projAll = [...(C.project_info || []), ...(C.projects || [])];
    const _projSeen = new Set();
    const allProjects = _projAll.filter(p => {
      if (!p || !p.id) return false;
      if (_projSeen.has(p.id)) return false;
      _projSeen.add(p.id);
      return true;
    });
    const active = allProjects.filter(p => p.status === 'active').length;
    // KPI 2: 待处理问题 = 内部 issues(open) + 客户投诉(field_log.is_customer_complaint 且未处理)
    const openIssues = issues.filter(i => i.status === 'open').length
      + (C.field_log || []).filter(r => r.is_customer_complaint && r.status !== '已处理').length;
    // KPI 3: 生产计划完成（主计划 tasks 本周到期且已完成的数量；口径可后续按需调）
    const now = new Date();
    const day = now.getDay() || 7; // 周日视作 7
    const monday = new Date(now); monday.setDate(now.getDate() - (day - 1)); monday.setHours(0, 0, 0, 0);
    const nextMon = new Date(monday); nextMon.setDate(monday.getDate() + 7);
    // 用本地日期字符串，勿用 toISOString()（UTC 会前移一天，导致周日到期被漏计）
    const lfmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const md = lfmt(monday);
    const nd = lfmt(nextMon);
    const plansDone = (C.tasks || []).filter(t => {
      if (t.status !== 'done') return false;
      const d = (t.due_date || '').slice(0, 10);
      return d && d >= md && d < nd;
    }).length;
    // KPI 4: 缺陷率（DOA 来料不良率）
    const totalRec = doa.reduce((a, r) => a + (+r.received_qty || 0), 0);
    const totalDef = doa.reduce((a, r) => a + (+r.defect_qty || 0), 0);
    const defectRate = totalRec > 0 ? (totalDef / totalRec * 100) : 0;
    // KPI 5: 每周 DOA 增加数（doa.date 落在本周）
    const doaWeek = doa.filter(r => { const d = (r.date || '').slice(0, 10); return d && d >= md && d < nd; }).length;
    // KPI 6: 每周新增客户投诉（field_log.is_customer_complaint，created_at 落在本周）
    const compWeek = (C.field_log || []).filter(r => {
      if (!r.is_customer_complaint) return false;
      const d = (r.created_at || '').slice(0, 10);
      return d && d >= md && d < nd;
    }).length;

    const kpi = (num, label, color, page) => `<div class="kpi-card" onclick="App.navigate('${page}')">
      <div class="kpi-head"><span class="kpi-dot" style="background:${color}"></span><span class="kpi-label">${label}</span></div>
      <div class="kpi-num" style="color:${color}">${num}</div>
    </div>`;

    // v3.16.2 桌面版与手机版统一：标题区上移至 home-header，驾驶舱只保留 KPI 卡片
    // v3.16.40 数字配色：进行中=紫 / 待处理问题=橘 / 生产计划完成=绿 / 缺陷率=红
    // v3.16.44 下方新增 每周DOA增加数(红) / 每周新增客户投诉(靛)
    // 六格统一一行（窄屏自动降列）：色点 + 标签 + 数字，不再分区块
    el.innerHTML = `
      <div class="kpi-grid kpi-grid-6">${[
        kpi(active,                     tr('进行中项目'),     '#7F77DD', 'production'),
        kpi(openIssues,                 tr('待处理问题'),     '#EF9F27', 'quality'),
        kpi(plansDone,                  tr('生产计划完成'),   '#1D9E75', 'production'),
        kpi(defectRate.toFixed(1) + '%', tr('缺陷率'),        '#E24B4A', 'inspection'),
        kpi(doaWeek,                    tr('每周DOA增加数'),  '#D85A30', 'inspection'),
        kpi(compWeek,                   tr('每周新增客户投诉'), '#378ADD', 'fieldlog'),
      ].join('')}</div>
    `;
  };
}