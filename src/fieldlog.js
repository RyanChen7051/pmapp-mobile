/* ═══ 现场记录模块（产线状况实时登录，管理员手机端）═══
 * 面向国外驻点管理员：在产线遇异常时，及时记录「生产项目 / 问题发生工厂 / 生产问题叙述 / 照片」。
 * 照片经 Canvas 自动压缩（限宽 1280px、JPEG 0.55）转 base64 存入 sync_data，避免占用系统空间。
 * 权限：admin(admin/admin2) 可新建/编辑；leader 为 viewer（只读）。
 */
import { t } from './i18n.js';

export function setupFieldLog(App) {
  // 当前编辑器会话的临时照片数组
  App._flPhotos = [];

  // ─── 相机 / 相册选择后自动压缩 ───
  App.flAddPhotos = async function (input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const dataUrl = await this._flCompress(f, 1280, 0.55);
        this._flPhotos.push({ data: dataUrl, name: f.name || ('photo_' + Date.now()), size: Math.round(dataUrl.length * 0.75) });
      } catch (e) { this.toast('照片处理失败: ' + e.message); }
    }
    input.value = '';
    this._flRenderPhotos();
  };

  // Canvas 压缩：返回压缩后的 JPEG dataURL
  App._flCompress = function (file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('读取失败'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('解码失败'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const r = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * r); height = Math.round(height * r);
          }
          const c = document.createElement('canvas');
          c.width = width; c.height = height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          c.toBlob(b => {
            if (!b) return reject(new Error('压缩失败'));
            const rd = new FileReader();
            rd.onerror = () => reject(new Error('编码失败'));
            rd.onload = () => resolve(rd.result);
            rd.readAsDataURL(b);
          }, 'image/jpeg', quality);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  App._flRenderPhotos = function () {
    const box = document.getElementById('fl-photos');
    if (!box) return;
    if (!this._flPhotos.length) { box.innerHTML = ''; return; }
    box.innerHTML = this._flPhotos.map((p, i) => `<div class="fl-photo"><img src="${p.data}" alt="${this.esc(p.name)}"><span class="del" onclick="App._flDelPhoto(${i})">✕</span></div>`).join('');
  };

  App._flDelPhoto = function (i) {
    this._flPhotos.splice(i, 1);
    this._flRenderPhotos();
  };

  // ─── 列表 ───
  App.loadFieldLog = function () {
    this.updateAdminButtons();
    const list = (this.cache.field_log || []).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const el = document.getElementById('fieldlog-list');
    if (!el) return;
    if (list.length === 0) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">📸</div>暂无现场记录${this.isAdmin() ? ' · 点右下角 + 新增' : ''}</div>`;
      return;
    }
    el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('field_log', ${r.id})">
      <div class="card-head"><div class="card-title">📸 ${this.esc(r.project || '未指定项目')}</div>
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${this.esc(r.status)}</span>` : ''}</div>
      <div class="card-meta"><span>🏭 ${this.esc(r.problem_factory || r.factory || '—')}</span>${r.photos ? `<span>📷 ${r.photos.length}</span>` : ''}<span>🕒 ${this.esc((r.created_at || '').slice(0, 16))}</span></div>
      ${r.description ? `<div class="card-desc">${this.esc((r.description || '').slice(0, 80))}</div>` : ''}
    </div>`).join('');
  };

  // ─── 按类别渲染现场问题到对应栏目区块 ───
  App.renderFieldLogByCategory = function (containerId, category) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const list = (this.cache.field_log || [])
      .filter(r => r.problem_category === category)
      .slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">📸</div>暂无「${this.esc(category)}」相关现场问题</div>`; return; }
    el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('field_log', ${r.id})">
      <div class="card-head"><div class="card-title">📸 ${this.esc(r.project || '未指定项目')}</div>
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${this.esc(r.status)}</span>` : ''}</div>
      <div class="card-meta"><span>🏭 ${this.esc(r.problem_factory || r.factory || '—')}</span>${r.problem_factory ? `<span>📍 ${this.esc(r.problem_factory)}</span>` : ''}<span>🕒 ${this.esc((r.created_at || '').slice(0, 16))}</span></div>
      ${r.description ? `<div class="card-desc">${this.esc((r.description || '').slice(0, 80))}</div>` : ''}
    </div>`).join('');
  };

  // ─── 编辑器（新建 / 编辑）───
  App.showFieldLogEditor = function (id) {
    if (!this.canEdit('field_log')) { this.toast('只读模式，无法新建/编辑'); return; }
    const projects = this.cache.projects || [];
    const factories = this.cache.factory_info || [];
    const projOpts = '<option value="">（未选）</option>' + projects.map(p => `<option value="${this.esc(p.name)}">${this.esc(p.name)}</option>`).join('');
    const facOpts = '<option value="">（未选）</option>' + factories.map(f => `<option value="${this.esc(f.factory_name)}">${this.esc(f.factory_name)}</option>`).join('');
    let rec = null;
    if (id != null) {
      rec = (this.cache.field_log || []).find(r => r.id === id);
      if (!rec) return;
    }
    this._flPhotos = rec && rec.photos ? rec.photos.slice() : [];
    const nowISO = new Date().toISOString();
    const newRec = rec || { id: Date.now(), created_at: nowISO.slice(0, 19).replace('T', ' '), status: '待处理', reporter: this.session?.user?.display_name || this.session?.user?.username || '' };

    const html = `<div class="modal-handle"></div>
      <div class="modal-title">${rec ? '编辑' : '新建'}现场记录</div>
      <div class="input-group"><label>生产项目</label><select id="fl-project">${projOpts}</select></div>
      <div class="input-group"><label>问题发生工厂</label><select id="fl-problem-factory">${facOpts}</select></div>
      <div class="input-group"><label>问题类别</label><select id="fl-problem-category">
        <option value="">（未选 / 不归类）</option>
        <option value="工程">工程</option>
        <option value="品质">品质</option>
        <option value="EMS制程">EMS制程</option>
      </select></div>
      <div class="input-group"><label>生产问题叙述</label><textarea id="fl-description" placeholder="描述产线遇到的状况、异常、数量等…">${this.esc(newRec.description || '')}</textarea></div>
      <div class="input-group"><label>处理状态</label><select id="fl-status">
        <option value="待处理" ${newRec.status === '待处理' ? 'selected' : ''}>待处理</option>
        <option value="处理中" ${newRec.status === '处理中' ? 'selected' : ''}>处理中</option>
        <option value="已处理" ${newRec.status === '已处理' ? 'selected' : ''}>已处理</option>
      </select></div>
      <div class="input-group"><label>现场照片（自动压缩，不占空间）</label>
        <input type="file" id="fl-photos-input" accept="image/*" capture="environment" multiple onchange="App.flAddPhotos(this)">
        <div class="fl-photos" id="fl-photos"></div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">点击上方按钮调用相机/相册，照片将自动缩小后保存。</div>
      </div>
      <button class="btn btn-primary" onclick="App.saveFieldLog(${newRec.id})">保存</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
    if (rec) {
      const pe = document.getElementById('fl-project'); if (pe && rec.project) pe.value = rec.project;
      const pef = document.getElementById('fl-problem-factory'); if (pef && rec.problem_factory) pef.value = rec.problem_factory;
      const pcat = document.getElementById('fl-problem-category'); if (pcat && rec.problem_category) pcat.value = rec.problem_category;
    }
    this._flRenderPhotos();
  };

  App.saveFieldLog = async function (id) {
    const project = (document.getElementById('fl-project')?.value || '').trim();
    const problemFactory = (document.getElementById('fl-problem-factory')?.value || '').trim();
    const problemCategory = document.getElementById('fl-problem-category')?.value || '';
    const description = (document.getElementById('fl-description')?.value || '').trim();
    const status = document.getElementById('fl-status')?.value || '待处理';
    if (!description && !project) { this.toast('请至少填写项目或问题叙述'); return; }
    const now = new Date().toISOString();
    const rec = {
      id, project, problem_factory: problemFactory, problem_category: problemCategory, description, status,
      photos: this._flPhotos.slice(),
      reporter: this.session?.user?.display_name || this.session?.user?.username || '',
      created_at: now.slice(0, 19).replace('T', ' '),
      updated_at: now.slice(0, 19).replace('T', ' '),
    };
    try {
      await this.sbPost('sync_data', {
        table_name: 'field_log', local_id: id,
        payload: JSON.stringify(rec), supabase_id: this.uuid(),
        is_deleted: false, updated_at: now, device_id: this.deviceId,
      });
      this.cache.field_log = this.cache.field_log || [];
      this.cache.field_log.unshift(rec);
      this.closeModal();
      this.loadFieldLog();
      this.toast('已保存现场记录，桌面端将自动同步');
    } catch (e) { this.toast('保存失败: ' + e.message); }
  };
}
