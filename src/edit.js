/* ═══ Edit / Create Forms ═══ */
import { MODULES } from './config.js';
import { tr } from './i18n.js';

export function setupEdit(App) {
  App.showCreate = function() {
    if (!this.canEdit(this.currentModule)) { this.toast(tr('只读模式，无法新建')); return; }
    if (!this.currentModule) return;
    const mod = MODULES[this.currentModule];
    if (!mod || !mod.editFields) return;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newRec = { id: Math.floor(Date.now() / 1000), created_at: now, updated_at: now };
    if (this.currentModule === 'issues') { newRec.status = 'open'; newRec.severity = 'medium'; newRec.issue_type = 'other'; }
    if (this.currentModule === 'tasks') { newRec.status = 'todo'; newRec.priority = 'medium'; }
    if (this.currentModule === 'projects') { newRec.status = 'planning'; newRec.stage = 'NPI'; }
    if (this.currentModule === 'shipping_plans') { newRec.status = 'planned'; newRec.shipping_method = 'sea'; }
    if (this.currentModule === 'users') { newRec.status = 'active'; }
    this._showForm(this.currentModule, newRec, true);
  };

  App.showCreateFor = function(moduleKey) {
    if (!this.canEdit(moduleKey)) { this.toast(tr('只读模式')); return; }
    this.currentModule = moduleKey;
    this.showCreate();
  };

  App.showEditFor = function(moduleKey, id) {
    if (!this.canEdit(moduleKey)) { this.toast(tr('只读模式')); return; }
    const record = (this.cache[moduleKey] || []).find(r => r.id === id);
    if (!record) return;
    this._showForm(moduleKey, record, false);
  };

  App._showForm = function(moduleKey, record, isCreate) {
    const mod = MODULES[moduleKey];
    let html = `<div class="modal-handle"></div><div class="modal-title">${isCreate ? tr('新建') : tr('编辑')}${tr(mod.title)}</div>`;
    mod.editFields.forEach(f => {
      const val = record[f.key] !== undefined ? record[f.key] : '';
      if (f.type === 'toggle') {
        html += `<div class="input-group" style="display:flex;justify-content:space-between;align-items:center"><label style="margin-bottom:0">${tr(f.label)}</label><label class="toggle"><input type="checkbox" id="edit-${f.key}" ${val ? 'checked' : ''}><span class="toggle-slider"></span></label></div>`;
      } else if (f.type === 'select') {
        html += `<div class="input-group"><label>${tr(f.label)}</label><select id="edit-${f.key}">`;
        f.options.forEach(o => { html += `<option value="${o.v}" ${String(val) === o.v ? 'selected' : ''}>${tr(o.t)}</option>`; });
        html += '</select></div>';
      } else if (f.type === 'textarea') {
        html += `<div class="input-group"><label>${tr(f.label)}</label><textarea id="edit-${f.key}">${this.esc(val)}</textarea></div>`;
      } else if (f.type === 'number') {
        html += `<div class="input-group"><label>${tr(f.label)}</label><input type="number" id="edit-${f.key}" value="${this.esc(val)}"></div>`;
      } else if (f.type === 'date') {
        html += `<div class="input-group"><label>${tr(f.label)}</label><input type="date" id="edit-${f.key}" value="${val ? String(val).slice(0, 10) : ''}"></div>`;
      } else {
        html += `<div class="input-group"><label>${tr(f.label)}${f.required ? ' *' : ''}</label><input type="text" id="edit-${f.key}" value="${this.esc(val)}"></div>`;
      }
    });
    html += `<button class="btn btn-primary" onclick="App.saveRecord('${moduleKey}', ${record.id}, ${isCreate})">${tr('保存')}</button><div style="height:10px"></div><button class="btn btn-secondary" onclick="App.closeModal()">${tr('取消')}</button>`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
    this._editingRecord = record;
    this._editingIsCreate = isCreate;
    this._editingModule = moduleKey;
  };

  App.saveRecord = async function(moduleKey, id, isCreate) {
    const mod = MODULES[moduleKey];
    const record = this._editingRecord;
    if (!record) return;
    const updated = { ...record };
    mod.editFields.forEach(f => {
      const el = document.getElementById('edit-' + f.key);
      if (!el) return;
      if (f.type === 'toggle') updated[f.key] = el.checked ? 1 : 0;
      else if (f.type === 'number') updated[f.key] = el.value ? parseFloat(el.value) : null;
      else updated[f.key] = el.value.trim();
    });
    for (const f of mod.editFields) {
      if (f.required && !updated[f.key]) { this.toast(tr(f.label) + ' ' + tr('不能为空')); return; }
    }
    updated.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
      let sbId = record._sb_id;
      if (!sbId) {
        const existing = await this.sbGet('sync_data', `table_name=eq.${mod.table}&local_id=eq.${id}&is_deleted=eq.false&select=supabase_id&order=updated_at.desc&limit=1`);
        if (existing.length > 0) sbId = existing[0].supabase_id;
      }
      const payload = JSON.stringify(updated);
      const nowISO = new Date().toISOString();
      if (sbId) {
        await this.sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: nowISO, device_id: this.deviceId });
      } else {
        sbId = this.uuid();
        await this.sbPost('sync_data', { table_name: mod.table, local_id: id, payload, supabase_id: sbId, is_deleted: false, updated_at: nowISO, device_id: this.deviceId });
      }
      const idx = (this.cache[moduleKey] || []).findIndex(r => r.id === id);
      if (idx >= 0) this.cache[moduleKey][idx] = { ...updated, _sb_id: sbId, _updated: nowISO };
      else { this.cache[moduleKey] = this.cache[moduleKey] || []; this.cache[moduleKey].unshift({ ...updated, _sb_id: sbId, _updated: nowISO }); }
      this.closeModal();
      if (this.currentPage === 'project-detail' && moduleKey === 'projects') this.renderProjectDetail(updated);
      else if (this.currentPage === 'module-detail') this.renderDetail(moduleKey, id);
      else this.navigate(this.currentPage);
      this.toast(tr('已保存，桌面端将自动同步'));
    } catch (e) { this.toast(tr('保存失败: ') + e.message); }
  };
}
