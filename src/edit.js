/* ═══ Edit / Create Forms ═══ */
import { MODULES } from './config.js';
import { tr } from './i18n.js';

export function setupEdit(App) {
  /* 本地记录 id：秒级时间戳。同一秒内连续新建会撞 id（后者覆盖前者，
   * 连 Supabase 的 local_id 也会重复），故撞车时递增到空闲值。
   * 不用毫秒是因为 sync_data.local_id 为整型，毫秒值会溢出。 */
  App._newLocalId = function(moduleKey) {
    let id = Math.floor(Date.now() / 1000);
    const used = new Set((this.cache[moduleKey] || []).map(r => String(r.id)));
    let guard = 0;
    while (used.has(String(id)) && guard++ < 1000) id += 1;
    return id;
  };

  App.showCreate = function() {
    if (!this.canEdit(this.currentModule)) { this.toast(tr('只读模式，无法新建')); return; }
    if (!this.currentModule) return;
    const mod = MODULES[this.currentModule];
    if (!mod || !mod.editFields) return;
    // 前置依赖：例如生产计划（主计划）必须先有项目讯息
    if (mod.requires && (this.cache[mod.requires] || []).length === 0) {
      this.toast(tr(mod.requiresMsg || '请先建立项目讯息'));
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newRec = { id: this._newLocalId(this.currentModule), created_at: now, updated_at: now };
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

  /* ═══ picker 字段：从另一个模块（如 project_info）点选一条并关联 ═══
   * 配置：{key,label,type:'picker',source:'project_info',textKeys:[...],textSep:' / ',labelKey:'project_ref'}
   * 选中后 updated[key] = 记录 id，updated[labelKey] = 展示文本。
   * 选择器用独立的 #picker-overlay，不会覆盖主表单里已填的内容。 */
  App._pickerText = function(rec, textKeys, sep) {
    return (textKeys || []).map(k => String(rec[k] || '').trim()).filter(Boolean).join(sep || ' / ');
  };

  App.closePicker = function(e) {
    if (e && e.target.id !== 'picker-overlay') return;
    document.getElementById('picker-overlay')?.classList.remove('show');
  };

  App._openPicker = function(html) {
    const box = document.getElementById('picker-content');
    const ov = document.getElementById('picker-overlay');
    if (!box || !ov) return false;
    box.innerHTML = html;
    ov.classList.add('show');
    return true;
  };

  App._fieldDef = function(moduleKey, fieldKey) {
    const mod = MODULES[moduleKey];
    return (mod?.editFields || []).find(x => x.key === fieldKey) || null;
  };

  // 自动编号：{type:'autocode', from:'project_id', codeKeys:[...], countModule:'tasks', countBy:'project_id'}
  App._genAutoCode = function(moduleKey, f) {
    const sel = (this._pickerSel || {})[moduleKey + '.' + f.from];
    if (!sel || !sel.raw) return '';
    const src = sel.raw;
    const base = (f.codeKeys || []).map(k => String(src[k] || '').trim()).filter(Boolean).join('-');
    if (!base) return '';
    const pool = this.cache[f.countModule || moduleKey] || [];
    const n = pool.filter(r => String(r[f.countBy]) === String(sel.id)).length;
    return base + '-' + String(n + 1).padStart(2, '0');
  };

  // 选中/清空后：刷新按钮文字 + 重算自动编号
  App._refreshPickerField = function(moduleKey, fieldKey) {
    const mod = MODULES[moduleKey];
    const sel = (this._pickerSel || {})[moduleKey + '.' + fieldKey];
    const btn = document.getElementById('pick-' + fieldKey);
    if (btn) btn.innerHTML = '📁 ' + this.esc(sel ? sel.label : tr('请选择'));
    (mod?.editFields || []).filter(f => f.type === 'autocode' && f.from === fieldKey).forEach(f => {
      const input = document.getElementById('edit-' + f.key);
      // 用户手改过就不再覆盖（避免选项目时把已确认的编号冲掉）
      if (input && !input.dataset.touched) input.value = this._genAutoCode(moduleKey, f);
    });
  };

  App.pickField = function(moduleKey, fieldKey) {
    const f = this._fieldDef(moduleKey, fieldKey);
    if (!f || f.type !== 'picker') return;
    const list = this.cache[f.source] || [];
    if (!list.length) { this.toast(tr('暂无项目讯息')); return; }
    const html = `<div class="modal-handle"></div><div class="modal-title">${tr(f.label)}</div>` +
      list.map(r => `<div class="card" onclick="App.selectField('${moduleKey}','${fieldKey}',${r.id})">
        <div class="card-title">🗂 ${this.esc(this._pickerText(r, f.textKeys, f.textSep))}</div>
        <div class="card-meta">
          ${r.production_factory ? `<span>🏭 ${this.esc(r.production_factory)}</span>` : ''}
          ${r.project_stage ? `<span class="badge ${this.badgeClass(r.project_stage)}">${this.esc(tr(r.project_stage === 'MP' ? '量产' : r.project_stage))}</span>` : ''}
        </div></div>`).join('') +
      `<div style="height:10px"></div>
       <button class="btn btn-secondary" onclick="App.clearField('${moduleKey}','${fieldKey}')">${tr('清除选择')}</button>
       <div style="height:10px"></div>
       <button class="btn btn-secondary" onclick="App.closePicker()">${tr('取消')}</button>`;
    this._openPicker(html);
  };

  App.selectField = function(moduleKey, fieldKey, id) {
    const f = this._fieldDef(moduleKey, fieldKey);
    if (!f) return;
    const rec = (this.cache[f.source] || []).find(r => String(r.id) === String(id));
    if (!rec) return;
    this._pickerSel = this._pickerSel || {};
    this._pickerSel[moduleKey + '.' + fieldKey] = { id: rec.id, label: this._pickerText(rec, f.textKeys, f.textSep), raw: rec };
    this._refreshPickerField(moduleKey, fieldKey);
    this.closePicker();
  };

  App.clearField = function(moduleKey, fieldKey) {
    this._pickerSel = this._pickerSel || {};
    delete this._pickerSel[moduleKey + '.' + fieldKey];
    this._refreshPickerField(moduleKey, fieldKey);
    this.closePicker();
  };

  App._showForm = function(moduleKey, record, isCreate) {
    const mod = MODULES[moduleKey];
    let html = `<div class="modal-handle"></div><div class="modal-title">${isCreate ? tr('新建') : tr('编辑')}${tr(mod.title)}</div>`;
    mod.editFields.forEach(f => {
      const val = record[f.key] !== undefined ? record[f.key] : '';
      if (f.type === 'picker') {
        const src = (this.cache[f.source] || []).find(r => String(r.id) === String(record[f.key]));
        this._pickerSel = this._pickerSel || {};
        this._pickerSel[moduleKey + '.' + f.key] = src
          ? { id: src.id, label: this._pickerText(src, f.textKeys, f.textSep), raw: src }
          : null;
        html += `<div class="input-group"><label>${tr(f.label)}${f.required ? ' *' : ''}</label><button type="button" class="btn btn-secondary" id="pick-${f.key}" onclick="App.pickField('${moduleKey}','${f.key}')">📁 ${this.esc(src ? this._pickerText(src, f.textKeys, f.textSep) : tr('请选择'))}</button></div>`;
      } else if (f.type === 'autocode') {
        const code = record[f.key] || this._genAutoCode(moduleKey, f);
        html += `<div class="input-group"><label>${tr(f.label)}</label><input type="text" id="edit-${f.key}" value="${this.esc(code)}" oninput="this.dataset.touched='1'" style="opacity:.9"></div>`;
      } else if (f.type === 'toggle') {
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
      if (f.type === 'picker') {
        const sel = (this._pickerSel || {})[moduleKey + '.' + f.key];
        updated[f.key] = sel ? sel.id : '';
        if (f.labelKey) updated[f.labelKey] = sel ? sel.label : '';
        return;
      }
      const el = document.getElementById('edit-' + f.key);
      if (!el) return;
      if (f.type === 'toggle') updated[f.key] = el.checked ? 1 : 0;
      else if (f.type === 'autocode') updated[f.key] = el.value.trim();
      else if (f.type === 'number') updated[f.key] = el.value ? parseFloat(el.value) : null;
      else updated[f.key] = el.value.trim();
    });
    for (const f of mod.editFields) {
      if (!f.required) continue;
      const v = f.type === 'picker' ? ((this._pickerSel || {})[moduleKey + '.' + f.key] ? 'x' : '') : updated[f.key];
      if (!v) { this.toast(tr(f.label) + ' ' + tr('不能为空')); return; }
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
