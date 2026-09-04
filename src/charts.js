/* ═══ Charts Module (stub) ═══ */
import { tr } from './i18n.js';
export function setupCharts(App) {
  // TODO: restore chart functionality if needed
  App.renderCharts = function () {
    const el = document.getElementById('charts');
    if (el) el.innerHTML = `<div class="empty">${tr('图表模块暂不可用')}</div>`;
  };
}
