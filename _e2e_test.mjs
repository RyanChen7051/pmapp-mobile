// E2E 逻辑校验：用 DOM 桩加载真实模块，验证驾驶舱/图表/现场记录渲染不抛错
const els = {};
function makeEl(id) {
  return {
    _id: id, innerHTML: '', textContent: '', value: '', files: [], style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, appendChild() {},
    addEventListener() {}, querySelector() { return makeEl('q'); }, querySelectorAll() { return []; },
    getContext() { return { drawImage() {} }; },
  };
}
globalThis.document = {
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelector: () => makeEl('q'), querySelectorAll: () => [],
  createElement: () => makeEl('created'),
  addEventListener() {}, body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
};
globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, location: {}, App: null, deviceId: 'd1' };
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
// Node 22 提供只读 navigator getter，需用 defineProperty 覆盖
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', onLine: true, serviceWorker: undefined },
    configurable: true, writable: true,
  });
} catch (e) { /* 已是只读，忽略 */ }
globalThis.fetch = async () => ({ ok: true, json: async () => ({ reply: 'ok' }) });

const { setupCharts } = await import('./src/charts.js');
const { setupCockpit } = await import('./src/cockpit.js').then(m => ({ setupCockpit: m.setupCockpit }));
const { setupFieldLog } = await import('./src/fieldlog.js');
const { MODULES } = await import('./src/config.js');

const App = {
  cache: {
    projects: [{ id: 1, name: 'P-1', status: 'active', stage: 'MP', delivery_date: '2026-08-01' }, { id: 2, name: 'P-2', status: 'active', stage: 'EVT' }],
    issues: [{ id: 1, title: '坏了吗', severity: 'high', status: 'open', issue_type: 'quality', description: 'x' }, { id: 2, title: 'a', severity: 'low', status: 'closed', issue_type: 'other' }],
    doa: [{ id: 1, date: '2026-07-01', received_qty: 100, defect_qty: 5, factory: 'F1', material_name: 'M1' }, { id: 2, date: '2026-07-15', received_qty: 200, defect_qty: 10, factory: 'F2', material_name: 'M2' }],
    rma: [{ id: 1, date: '2026-07-07', return_qty: 3, status: '已处理', project: 'P-1' }, { id: 2, date: '2026-06-20', return_qty: 2, status: '待处理', project: 'P-2' }],
    shipping_plans: [{ id: 1, plan_no: 'S1', status: 'planned', destination: 'US', planned_ship_date: '2026-08-02' }, { id: 2, plan_no: 'S2', status: 'shipped', destination: 'EU', planned_ship_date: '2026-07-10' }],
    inspection: [{ id: 1, title: '客验1', item: '外观', inspect_date: '2026-07-05', qty: 50, order_no: 'O1' }],
    overseas_material_alerts: [{ id: 1, rule_name: 'R1', is_enabled: true }],
    factory_info: [{ id: 1, factory_name: 'F1' }, { id: 2, factory_name: 'F2' }],
    field_log: [{ id: 1, project: 'P-1', factory: 'F1', description: '产线异常', status: '待处理', photos: [], created_at: '2026-07-20T10:00:00', reporter: 'admin' }],
  },
  session: { user: { display_name: 'Admin', username: 'admin', role: 'admin' } },
  esc: (s) => (s === null || s === undefined) ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  badgeClass: () => 'badge',
  isAdmin: () => true, canEdit: () => true, navigate() {}, toast() {}, uuid: () => 'u' + Math.random().toString(36).slice(2),
  updateAdminButtons() {}, sbPost() { return { ok: true }; },
  cockpitFilter: { project: '', q: '' },
};
setupCharts(App); setupCockpit(App); setupFieldLog(App);
App.renderCockpit();
const html = document.getElementById('cockpit').innerHTML;
console.log('COCKPIT_LEN', html.length, 'HAS_KPI', html.includes('kpi-grid'), 'HAS_AI', html.includes('ai-btn'), 'HAS_SVG', html.includes('<svg'));
console.log('LINE', App.chartLine(['a', 'b'], [{ name: 'x', color: '#f00', values: [1, 2] }]).includes('<svg'));
console.log('DOUGHNUT', App.chartDoughnut([{ label: 'A', value: 3, color: '#f00' }]).includes('<svg'));
console.log('STACKED', App.chartStacked(['x'], [{ name: 's', color: '#0f0', values: [1] }]).includes('<svg'));
console.log('HBAR', App.chartHBar([{ label: 'a', value: 5, color: '#00f' }]).includes('<svg'));
App.loadFieldLog();
console.log('FIELDLOG', document.getElementById('fieldlog-list').innerHTML.includes('P-1'));
App.showFieldLogEditor(null);
console.log('EDITOR_OK', document.getElementById('modal-content').innerHTML.includes('fl-description'));
console.log('MODULES_HAS_FIELDLOG', !!MODULES.field_log);
console.log('ALL_OK');
