/* ═══ Charts Module (stub) ═══ */
export function setupCharts(App) {
  // TODO: restore chart functionality if needed
  App.renderCharts = function () {
    const el = document.getElementById('charts');
    if (el) el.innerHTML = '<div class="empty">图表模块暂不可用</div>';
  };
}
