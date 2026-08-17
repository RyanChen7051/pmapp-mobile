/* ═══ Meetings Module (stub) ═══ */
export function setupMeetings(App) {
  // TODO: restore meeting functionality if needed
  App.renderMeetings = function () {
    const el = document.getElementById('meetings');
    if (el) el.innerHTML = '<div class="empty">会议模块暂不可用</div>';
  };
}
