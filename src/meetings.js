/* ═══ Meetings Module ═══ */
import { MODULES } from './config.js';

export function setupMeetings(App) {
  // 会议列表占位（reports 页会议区使用）
  App.renderMeetings = function () {
    const el = document.getElementById('meetings');
    if (el) el.innerHTML = '<div class="empty">会议模块暂不可用</div>';
  };

  // 打开会议记录编辑/上传弹窗（index.html 上传会议记录按钮调用）
  App.openMeetingEditor = function (id) {
    if (!this.canEdit('meetings')) { this.toast('只读模式，无法上传'); return; }
    const rec = id ? (this.cache.meetings || []).find(r => r.id === id) : null;
    const title = rec && rec.title ? rec.title : '';
    const date = rec && rec.meeting_date ? rec.meeting_date : new Date().toISOString().slice(0, 10);
    const notes = rec && rec.notes ? rec.notes : '';
    const html =
      '<div class="modal-handle"></div>' +
      '<div class="modal-title">' + (rec ? '编辑' : '上传') + '会议记录</div>' +
      '<div class="input-group"><label>主题</label><input type="text" id="mt-title" value="' + this.esc(title) + '" placeholder="会议主题"></div>' +
      '<div class="input-group"><label>日期</label><input type="date" id="mt-date" value="' + this.esc(date) + '"></div>' +
      '<div class="input-group"><label>纪要</label><textarea id="mt-notes" placeholder="会议内容 / 决议">' + this.esc(notes) + '</textarea></div>' +
      '<button class="btn btn-primary" onclick="App.saveMeeting(' + (id || 'null') + ')">保存</button>' +
      '<div style="height:10px"></div>' +
      '<button class="btn btn-secondary" onclick="App.closeModal()">取消</button>';
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
  };

  // 保存会议记录（写入 sync_data，table_name=meetings）
  App.saveMeeting = async function (id) {
    const titleEl = document.getElementById('mt-title');
    const dateEl = document.getElementById('mt-date');
    const notesEl = document.getElementById('mt-notes');
    const title = titleEl ? titleEl.value.trim() : '';
    const date = dateEl ? dateEl.value : '';
    const notes = notesEl ? notesEl.value : '';
    if (!title) { this.toast('主题不能为空'); return; }
    const nowISO = new Date().toISOString();
    const now = nowISO.slice(0, 19).replace('T', ' ');
    const payload = JSON.stringify({ title, meeting_date: date, notes, updated_at: now });
    try {
      if (id) {
        const existing = await this.sbGet('sync_data', 'table_name=eq.meetings&local_id=eq.' + id + '&is_deleted=eq.false&select=supabase_id&order=updated_at.desc&limit=1');
        if (existing.length > 0) {
          await this.sbPatch('sync_data', 'supabase_id=eq.' + existing[0].supabase_id, { payload, updated_at: nowISO, device_id: this.deviceId });
        } else {
          const sbId = this.uuid();
          await this.sbPost('sync_data', { table_name: 'meetings', local_id: id, payload, supabase_id: sbId, is_deleted: false, updated_at: nowISO, device_id: this.deviceId });
        }
      } else {
        const lid = Math.floor(Date.now() / 1000);
        const sbId = this.uuid();
        await this.sbPost('sync_data', { table_name: 'meetings', local_id: lid, payload, supabase_id: sbId, is_deleted: false, updated_at: nowISO, device_id: this.deviceId });
      }
      this.toast('已保存，桌面端将自动同步');
      this.closeModal();
      if (this.currentPage === 'reports') this.renderMeetingList();
    } catch (e) { this.toast('保存失败: ' + e.message); }
  };

  // 渲染会议列表（index.html 会议搜索框 oninput 调用）
  App.renderMeetingList = function () {
    const el = document.getElementById('mt-list');
    if (!el) return;
    const qEl = document.getElementById('mt-search');
    const q = qEl ? (qEl.value || '').trim().toLowerCase() : '';
    const list = (this.cache.meetings || []).filter(m =>
      !q ||
      (m.title || '').toLowerCase().includes(q) ||
      (m.meeting_date || '').includes(q) ||
      (m.notes || '').toLowerCase().includes(q)
    );
    if (!list.length) { el.innerHTML = '<div class="empty">暂无会议记录</div>'; return; }
    el.innerHTML = list.map(m =>
      '<div class="mt-item" onclick="App.openMeetingEditor(' + m.id + ')">' +
        '<div class="mt-item-title">' + this.esc(m.title || '') + '</div>' +
        '<div class="mt-item-date">' + this.esc(m.meeting_date || '') + '</div>' +
      '</div>'
    ).join('');
  };
}
