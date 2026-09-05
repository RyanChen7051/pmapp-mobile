/* ═══ 现场记录模块（产线状况实时登录，管理员手机端）═══
 * 面向国外驻点管理员：在产线遇异常时，及时记录「生产项目 / 问题发生工厂 / 生产问题叙述 / 照片」。
 * 照片经 Canvas 自动压缩（限宽 1280px、JPEG 0.55）转 base64 存入 sync_data，避免占用系统空间。
 * 权限：admin(admin/admin2) 可新建/编辑；leader 为 viewer（只读）。
 */
import { t, tr, getLang } from './i18n.js';

/* ═══ 语音录入指令映射（SpeechRecognition lang / 命令词 / 结束词）═══
 * 识别语言跟随 PWA 界面语言；命令词支持「本地化 + 中文通用」双匹配，
 * 即使工程师用中文指令（栏目xxx / 栏目完毕）也能在任意语言界面下命中。 */
const VOICE_LANG = { zh: 'zh-CN', en: 'en-US', es: 'es-ES', ja: 'ja-JP', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', vi: 'vi-VN', hi: 'hi-IN' };
const VOICE_CMD_KW = { zh: '栏目', en: 'column', es: 'campo', ja: '項目', fr: 'champ', de: 'feld', ar: 'حقل', vi: 'trường', hi: 'फ़ील्ड' };
const VOICE_END = {
  zh: ['栏目完毕', '栏目结束'], en: ['column done', 'column finish'], es: ['campo fin', 'fin de campo'],
  ja: ['項目終了', '終了'], fr: ['fin de champ', 'champ fin'], de: ['feld fertig', 'ende feld'],
  ar: ['انتهى الحقل', 'حقل انتهى'], vi: ['trường xong', 'kết thúc trường'], hi: ['फ़ील्ड समाप्त', 'खत्म'],
};
// 文本归一化：去空格、转小写、去常用标点，便于命令/选项模糊匹配
function flNorm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/[，。、！？.,!?;:；：'"「」()（）]/g, '');
}

export function setupFieldLog(App) {
  // 当前编辑器会话的临时照片数组
  App._flPhotos = [];

  // ─── 相机 / 相册选择后自动压缩（最多 3 张）───
  const FL_MAX_PHOTOS = 3;
  App.flAddPhotos = async function (input) {
    const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    let added = 0;
    for (const f of files) {
      if (this._flPhotos.length >= FL_MAX_PHOTOS) { this.toast(tr('照片已达上限（最多 3 张）')); break; }
      try {
        const dataUrl = await this._flCompress(f, 1280, 0.55);
        this._flPhotos.push({ data: dataUrl, name: f.name || ('photo_' + Date.now()), size: Math.round(dataUrl.length * 0.75) });
        added++;
      } catch (e) { this.toast(tr('照片处理失败: ') + e.message); }
    }
    input.value = '';
    this._flRenderPhotos();
    if (added > 0 && this._flPhotos.length >= FL_MAX_PHOTOS) this.toast(tr('照片已达上限（最多 3 张）'));
  };

  // Canvas 压缩：返回压缩后的 JPEG dataURL
  App._flCompress = function (file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(tr('读取失败')));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error(tr('解码失败')));
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
            if (!b) return reject(new Error(tr('压缩失败')));
            const rd = new FileReader();
            rd.onerror = () => reject(new Error(tr('编码失败')));
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
      el.innerHTML = `<div class="empty"><div class="empty-icon">📸</div>${tr('暂无现场记录')}${this.isAdmin() ? ' · ' + tr('点右下角 + 新增') : ''}</div>`;
      return;
    }
    el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('field_log', ${r.id})">
      <div class="card-head"><div class="card-title">📸 ${this.esc(r.project ? tr(r.project) : tr('未指定项目'))}</div>
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${this.esc(tr(r.status))}</span>` : ''}</div>
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
    if (list.length === 0) { el.innerHTML = `<div class="empty"><div class="empty-icon">📸</div>${tr('相关现场问题暂无')} · ${tr(category)}</div>`; return; }
    el.innerHTML = list.map(r => `<div class="card" onclick="App.openDetail('field_log', ${r.id})">
      <div class="card-head"><div class="card-title">📸 ${this.esc(r.project ? tr(r.project) : tr('未指定项目'))}</div>
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${this.esc(tr(r.status))}</span>` : ''}</div>
      <div class="card-meta"><span>🏭 ${this.esc(r.problem_factory || r.factory || '—')}</span>${r.problem_factory ? `<span>📍 ${this.esc(r.problem_factory)}</span>` : ''}<span>🕒 ${this.esc((r.created_at || '').slice(0, 16))}</span></div>
      ${r.description ? `<div class="card-desc">${this.esc((r.description || '').slice(0, 80))}</div>` : ''}
    </div>`).join('');
  };

  // ═══ 现场智能参谋 Field Copilot ═══
  // 离线语义相似度检索：复用自有 field_log / doa / rma 历史，给出 TOP3 相似案例。
  // 不依赖网络、不依赖云端模型——这是通用平台做不到的（它们没有你们的历史数据）。

  // 中文连续双字 + 拉丁词 提取，用于文本相似度
  App._cjkBigrams = function (text) {
    const s = String(text || '').toLowerCase();
    const set = new Set();
    const segs = s.match(/[一-鿿]+/g) || [];
    for (const seg of segs) {
      for (let i = 0; i < seg.length - 1; i++) set.add(seg.slice(i, i + 2));
    }
    const words = s.match(/[a-z0-9]+/g) || [];
    for (const w of words) if (w.length >= 2) set.add(w);
    return set;
  };

  // 加权相似度评分（0-100）
  App._fieldCopilotScore = function (cur, rec) {
    let score = 0;
    const cProj = (cur.project || '').trim();
    const rProj = (rec.project || '').trim();
    if (cProj && rProj && cProj === rProj) score += 40;
    const cFac = (cur.problem_factory || cur.factory || '').trim();
    const rFac = (rec.problem_factory || rec.factory || '').trim();
    if (cFac && rFac && cFac === rFac) score += 25;
    const cCat = (cur.problem_category || '').trim();
    const rCat = (rec.problem_category || '').trim();
    if (cCat && rCat && cCat === rCat) score += 15;
    const cText = this._cjkBigrams(cur.description);
    const rText = this._cjkBigrams(rec.description || rec.material_name || rec.customer);
    if (cText.size && rText.size) {
      let inter = 0;
      for (const g of cText) if (rText.has(g)) inter++;
      const jac = inter / (cText.size + rText.size - inter);
      score += Math.round(jac * 20);
    }
    return Math.min(100, score);
  };

  // 从历史池里取 TOP3 相似案例
  App._fieldCopilotFind = function (cur) {
    const pool = [];
    (this.cache.field_log || []).forEach(r => { if (r.id !== cur.id) pool.push({ r, src: 'field_log', tag: '现场' }); });
    (this.cache.doa || []).forEach(r => pool.push({ r, src: 'doa', tag: 'DOA' }));
    (this.cache.rma || []).forEach(r => pool.push({ r, src: 'rma', tag: 'RMA' }));
    return pool
      .map(({ r, src, tag }) => ({ r, src, tag, score: this._fieldCopilotScore(cur, r) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  // 渲染相似案例面板（内联样式，零额外 CSS 依赖）
  App._fieldCopilotRender = function (cur) {
    const box = document.getElementById('fl-copilot');
    if (!box) return;
    const list = this._fieldCopilotFind(cur);
    if (!list.length) {
      box.innerHTML = `<div style="font-size:12px;color:var(--text-muted,#9aa0b4);margin:4px 0 8px">${tr('🧠 智能参谋：暂无相似历史案例（填好项目/工厂/叙述后会自动匹配）')}</div>`;
      return;
    }
    box.innerHTML = `<div style="font-size:13px;font-weight:600;color:var(--accent-blue,#4f9dff);margin:6px 0 8px">${tr('🧠 智能参谋 · 相似历史案例（TOP ')}${list.length}）</div>` + list.map(x => {
      const r = x.r;
      const title = r.material_name || r.project || r.customer || tr('记录');
      const meta = [r.project || r.material_name, r.problem_factory || r.factory].filter(Boolean).join(' · ');
      const snippet = (r.description || '').slice(0, 64);
      return `<div onclick="App.openDetail('${x.src}', ${r.id})" style="border:1px solid var(--border,#333);border-radius:10px;padding:10px;margin-bottom:8px;cursor:pointer;background:var(--bg-elev,#1c1c28)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;color:#9aa0b4">${x.tag}</span>
          <span style="font-size:12px;font-weight:600;color:#5fe39b">${tr('相似度 ')}${x.score}%</span>
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--text,#eee)">${this.esc(title)}</div>
        ${meta ? `<div style="font-size:12px;color:#9aa0b4;margin-top:2px">${this.esc(meta)}</div>` : ''}
        ${snippet ? `<div style="font-size:12px;color:#b8bccd;margin-top:4px;line-height:1.4">${this.esc(snippet)}</div>` : ''}
      </div>`;
    }).join('');
  };

  // 输入时防抖刷新面板
  App._fieldCopilotRefresh = function () {
    clearTimeout(this._flCpTimer);
    this._flCpTimer = setTimeout(() => {
      const cur = {
        id: this._flEditingId,
        project: (document.getElementById('fl-project')?.value || '').trim(),
        problem_factory: (document.getElementById('fl-problem-factory')?.value || '').trim(),
        problem_category: document.getElementById('fl-problem-category')?.value || '',
        description: (document.getElementById('fl-description')?.value || '').trim(),
      };
      this._fieldCopilotRender(cur);
    }, 220);
  };

  // 记录现场 GPS 定位（无信号/拒绝授权时静默降级）
  App.flCaptureGPS = function () {
    if (!navigator.geolocation) { this.toast(tr('此设备不支持定位')); return; }
    const btn = document.getElementById('fl-gps-btn');
    if (btn) btn.textContent = tr('📍 定位中…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this._flGps = pos.coords.latitude.toFixed(5) + ',' + pos.coords.longitude.toFixed(5);
        if (btn) btn.textContent = tr('✅ 已记录') + ' ' + this._flGps;
        this.toast(tr('现场定位已记录'));
      },
      err => {
        if (btn) btn.textContent = tr('📍 记录现场定位');
        this.toast(tr('定位失败: ') + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ─── 编辑器（新建 / 编辑）───
  App.showFieldLogEditor = function (id) {
    if (!this.canEdit('field_log')) { this.toast(tr('只读模式，无法新建/编辑')); return; }
    const projects = this.cache.projects || [];
    const factories = this.cache.factory_info || [];
    const projOpts = `<option value="">${tr('（未选）')}</option>` + projects.map(p => `<option value="${this.esc(p.name)}">${this.esc(p.name)}</option>`).join('');
    const facOpts = `<option value="">${tr('（未选）')}</option>` + factories.map(f => `<option value="${this.esc(f.factory_name)}">${this.esc(f.factory_name)}</option>`).join('');
    let rec = null;
    if (id != null) {
      rec = (this.cache.field_log || []).find(r => r.id === id);
      if (!rec) return;
    }
    const nowISO = new Date().toISOString();
    const newRec = rec || { id: Math.floor(Date.now() / 1000), created_at: nowISO.slice(0, 19).replace('T', ' '), status: '待处理', reporter: this.session?.user?.display_name || this.session?.user?.username || '' };
    this._flPhotos = rec && rec.photos ? rec.photos.slice() : [];
    this._flEditingId = newRec.id; this._flGps = '';

    if (this._flVoiceActive) this.flStopVoice();
    const kw = VOICE_CMD_KW[getLang()] || '栏目';
    const cmdChip = (shortKey) => `<span style="font-size:10px;color:#4f9dff;border:1px solid #4f9dff;border-radius:6px;padding:1px 6px;margin-left:6px;white-space:nowrap">${this.esc(kw + tr(shortKey))}</span>`;
    const html = `<div class="modal-handle"></div>
      <div class="modal-title">${rec ? tr('编辑') : tr('新建')}${tr('现场记录')}</div>
      <div id="fl-voice-bar" style="border:1px solid var(--border,#333);border-radius:12px;padding:10px;margin-bottom:10px;background:var(--bg-elev,#1c1c28)">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-primary" id="fl-voice-btn" onclick="App.flToggleVoice()" style="flex:0 0 auto">🎤 ${tr('语音录入')}</button>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.3">${tr('voice_wait_field')}</div>
        </div>
        <div id="fl-voice-status" style="display:none;margin-top:8px">
          <div style="display:flex;align-items:center;gap:6px"><span class="fl-vs-dot" style="width:8px;height:8px;border-radius:50%;background:#5fe39b;display:inline-block"></span><span id="fl-vs-state" style="font-size:13px;font-weight:600;color:#5fe39b"></span></div>
          <div id="fl-vs-target" style="font-size:12px;color:#4f9dff;margin-top:2px"></div>
          <div id="fl-vs-live" style="font-size:12px;color:var(--text-muted);margin-top:4px;min-height:16px;word-break:break-word"></div>
        </div>
        <div style="margin-top:8px;padding:8px 10px;border:1px dashed var(--border,#333);border-radius:8px;background:rgba(79,157,255,0.06)">
          <div style="font-size:12px;font-weight:600;color:#4f9dff;margin-bottom:4px">🎙 ${tr('voice_flow_title')}</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.6">
            1. ${tr('voice_step1')}<br>
            2. ${tr('voice_step2')}<br>
            3. ${tr('voice_step3')}<br>
            4. ${tr('voice_step4')}<br>
            5. ${tr('voice_step5')}
          </div>
        </div>
      </div>
      <div class="input-group" id="fl-g-fl-project"><label>${tr('生产项目')}${cmdChip('生产项目')}</label><select id="fl-project" onchange="App._fieldCopilotRefresh()">${projOpts}</select></div>
      <div class="input-group" id="fl-g-fl-problem-factory"><label>${tr('问题发生工厂')}${cmdChip('问题发生工厂')}</label><select id="fl-problem-factory" onchange="App._fieldCopilotRefresh()">${facOpts}</select></div>
      <div class="input-group" id="fl-g-fl-problem-category"><label>${tr('问题类别')}${cmdChip('问题类别')}</label><select id="fl-problem-category" onchange="App._fieldCopilotRefresh()">
        <option value="">${tr('（未选 / 不归类）')}</option>
        <option value="工程">${tr('工程')}</option>
        <option value="品质">${tr('品质')}</option>
        <option value="制程">${tr('制程')}</option>
      </select></div>
      <div class="input-group" id="fl-g-fl-description"><label>${tr('生产问题叙述')}${cmdChip('生产问题叙述')}</label><textarea id="fl-description" placeholder="${tr('描述产线遇到的状况、异常、数量等…')}" oninput="App._fieldCopilotRefresh()">${this.esc(newRec.description || '')}</textarea></div>
      <div id="fl-copilot" class="fl-copilot"></div>
      <div class="input-group" id="fl-g-fl-status"><label>${tr('处理状态')}${cmdChip('处理状态')}</label><select id="fl-status">
        <option value="待处理" ${newRec.status === '待处理' ? 'selected' : ''}>${tr('待处理')}</option>
        <option value="处理中" ${newRec.status === '处理中' ? 'selected' : ''}>${tr('处理中')}</option>
        <option value="已处理" ${newRec.status === '已处理' ? 'selected' : ''}>${tr('已处理')}</option>
      </select></div>
      <div class="input-group" id="fl-g-fl-reporter-email"><label>${tr('报告人邮箱（选填，便于抄送你自己）')}${cmdChip('报告人邮箱')}</label><input type="email" id="fl-reporter-email" inputmode="email" autocomplete="email" placeholder="${tr('你的邮箱，如 name@gunbase.com')}" value="${this.esc(newRec.reporter_email || '')}"></div>
      <div class="input-group" id="fl-g-fl-responsible-email"><label>${tr('负责处理人邮箱（选填，自动发邮件通知）')}${cmdChip('负责处理人邮箱')}</label><input type="email" id="fl-responsible-email" inputmode="email" autocomplete="email" placeholder="${tr('国内负责同事的邮箱')}" value="${this.esc(newRec.responsible_email || '')}"></div>
      <div class="input-group" id="fl-g-fl-photos"><label>${tr('现场照片（自动压缩，不占空间）')}</label>
        <input type="file" id="fl-photos-input" accept="image/*" capture="environment" multiple onchange="App.flAddPhotos(this)">
        <div class="fl-photos" id="fl-photos"></div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${tr('最多 3 张照片，点此拍摄/选择')}</div>
      </div>
      <button class="btn btn-secondary" id="fl-gps-btn" onclick="App.flCaptureGPS()" style="margin-bottom:8px">${tr('📍 记录现场定位')}</button>
      <button class="btn btn-primary" onclick="App.saveFieldLog(${newRec.id})">${tr('保存')}</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">${tr('取消')}</button>`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
    if (rec) {
      const pe = document.getElementById('fl-project'); if (pe && rec.project) pe.value = rec.project;
      const pef = document.getElementById('fl-problem-factory'); if (pef && rec.problem_factory) pef.value = rec.problem_factory;
      const pcat = document.getElementById('fl-problem-category'); if (pcat && rec.problem_category) pcat.value = rec.problem_category;
    }
    this._flRenderPhotos();
    this._fieldCopilotRefresh();
  };

  App.saveFieldLog = async function (id) {
    const project = (document.getElementById('fl-project')?.value || '').trim();
    const problemFactory = (document.getElementById('fl-problem-factory')?.value || '').trim();
    const problemCategory = document.getElementById('fl-problem-category')?.value || '';
    const description = (document.getElementById('fl-description')?.value || '').trim();
    const status = document.getElementById('fl-status')?.value || '待处理';
    const reporterEmail = (document.getElementById('fl-reporter-email')?.value || '').trim();
    const responsibleEmail = (document.getElementById('fl-responsible-email')?.value || '').trim();
    if (!description && !project) { this.toast(tr('请至少填写项目或问题叙述')); return; }
    const now = new Date().toISOString();
    const rec = {
      id, project, problem_factory: problemFactory, problem_category: problemCategory, description, status,
      reporter_email: reporterEmail, responsible_email: responsibleEmail,
      photos: this._flPhotos.slice(),
      gps: this._flGps || '',
      reporter: this.session?.user?.display_name || this.session?.user?.username || '',
      created_at: now.slice(0, 19).replace('T', ' '),
      updated_at: now.slice(0, 19).replace('T', ' '),
    };
    try {
      // 规范保存：编辑时按已有 supabase_id PATCH（避免产生重复行），新建则 POST 新行
      const existing = (this.cache.field_log || []).find(r => r.id === id);
      let sbId = existing && existing._sb_id;
      const payload = JSON.stringify(rec);
      if (sbId) {
        await this.sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: now, device_id: this.deviceId });
      } else {
        sbId = this.uuid();
        await this.sbPost('sync_data', { table_name: 'field_log', local_id: id, payload, supabase_id: sbId, is_deleted: false, updated_at: now, device_id: this.deviceId });
      }
      const idx = (this.cache.field_log || []).findIndex(r => r.id === id);
      const stored = { ...rec, _sb_id: sbId, _updated: now };
      if (idx >= 0) this.cache.field_log[idx] = stored;
      else { this.cache.field_log = this.cache.field_log || []; this.cache.field_log.unshift(stored); }
      this.closeModal();
      this.loadFieldLog();
      // 邮件通知：填了负责处理人邮箱则尝试发送（部署 Edge Function + 配置 SMTP 后自动发送；否则详情页可用 📧 按钮发送）
      let emailNote = ' — ' + tr('已同步');
      if (responsibleEmail) {
        const ok = await this._notifyFieldLogEmail(sbId);
        emailNote = ok ? tr('，已邮件通知负责处理人') : tr('，可在记录内点 📧 发送邮件');
      }
      this.toast(tr('已保存现场记录') + emailNote);
    } catch (e) { this.toast(tr('保存失败: ') + e.message); }
  };

  // 现场记录保存后，调用 Edge Function 发邮件（服务端用企业邮箱 SMTP 发送）
  // 返回 true=已成功触发发送；false=未部署/未配置/网络失败（此时可改用详情页 📧 按钮 mailto 发送）
  App._notifyFieldLogEmail = async function (sbId) {
    try {
      const resp = await fetch(`${this.apiBaseUrl()}/functions/v1/fieldlog-notify`, {
        method: 'POST',
        headers: this.sbHeaders(),
        body: JSON.stringify({ supabase_id: sbId }),
      });
      return resp.ok;
    } catch (e) { return false; }
  };

  // 立即可用的邮件发送：用 mailto 调起本机/手机邮件 App，预填收件人/抄送/主题/正文
  App._flMailto = function (id) {
    const rec = (this.cache.field_log || []).find(r => r.id === id);
    if (!rec) return;
    const to = (rec.responsible_email || '').trim();
    const cc = (rec.reporter_email || '').trim();
    if (!to && !cc) { this.toast(tr('请先填写负责处理人或报告人邮箱')); return; }
    const subject = `【现场记录待处理】${rec.project || '未指定项目'} · ${rec.problem_factory || '—'} (${rec.problem_category || '未分类'})`;
    const lines = [
      `生产项目: ${rec.project || ''}`,
      `问题发生工厂: ${rec.problem_factory || ''}`,
      `问题类别: ${rec.problem_category || ''}`,
      `处理状态: ${rec.status || ''}`,
      `报告人: ${rec.reporter || ''}`,
      `报告人邮箱: ${rec.reporter_email || ''}`,
      `负责处理人邮箱: ${rec.responsible_email || ''}`,
      `现场定位: ${rec.gps || ''}`,
      `记录时间: ${rec.created_at || ''}`,
      '',
      `问题叙述:`,
      rec.description || '',
      '',
      `打开 PMApp PWA 查看: https://ryanchen7051.github.io/pmapp-mobile/`,
    ];
    const body = lines.join('\n');
    const href = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  // 删除现场记录（软删：置 is_deleted=true；无 _sb_id 则仅删本地缓存）
  App.deleteFieldLog = async function (id) {
    if (!this.canEdit('field_log')) { this.toast(tr('只读模式，无法删除')); return; }
    if (!confirm(tr('确定删除这条现场记录？此操作不可撤销。'))) return;
    const rec = (this.cache.field_log || []).find(r => r.id === id);
    const sbId = rec && rec._sb_id;
    try {
      if (sbId) {
        const now = new Date().toISOString();
        await this.sbPatch('sync_data', `supabase_id=eq.${sbId}`, { is_deleted: true, updated_at: now });
      }
      this.cache.field_log = (this.cache.field_log || []).filter(r => r.id !== id);
      this.toast(tr('已删除该现场记录'));
      this.goBack();
      this.loadFieldLog();
    } catch (e) { this.toast(tr('删除失败: ') + e.message); }
  };

  // ═══ 语音录入引擎（Field Voice Capture · 逐条栏目状态机）═══
  // 流程：点麦克风 → 等待栏目指令(栏目xxx) → 切入该字段聆听内容 → 念结束词(栏目结束/栏目完毕)提交该字段 → 回到等待下一条。
  // 识别语言跟随 PWA 界面；支持本地化关键词(栏目/column/trường…) + 中文通用指令；引擎为 Web Speech API（Android Chrome 最适合印度/越南产线）。

  // 构建 7 字段的语音元数据：命令词 = 本地化关键词 + 短标签；select 含候选项用于模糊匹配
  App._flBuildVoiceFields = function () {
    const kw = VOICE_CMD_KW[getLang()] || '栏目';
    const f = (id, labelKey, shortKey, type, optsFn) => {
      const opts = optsFn ? optsFn().map(o => ({ raw: o, norm: flNorm(o), trn: flNorm(tr(o)) })) : null;
      return { id, labelKey, shortKey, type, opts, cmdLocal: flNorm(kw + ' ' + tr(shortKey)), cmdZh: flNorm('栏目' + shortKey) };
    };
    this._flVoiceFields = [
      f('fl-project', '生产项目', '生产项目', 'select', () => (this.cache.projects || []).map(p => p.name)),
      f('fl-problem-factory', '问题发生工厂', '问题发生工厂', 'select', () => (this.cache.factory_info || []).map(x => x.factory_name)),
      f('fl-problem-category', '问题类别', '问题类别', 'select', () => ['工程', '品质', '制程']),
      f('fl-description', '生产问题叙述', '生产问题叙述', 'textarea'),
      f('fl-status', '处理状态', '处理状态', 'select', () => ['待处理', '处理中', '已处理']),
      f('fl-reporter-email', '报告人邮箱', '报告人邮箱', 'email'),
      f('fl-responsible-email', '负责处理人邮箱', '负责处理人邮箱', 'email'),
    ];
  };

  App._flFieldById = function (id) { return (this._flVoiceFields || []).find(x => x.id === id); };

  // 在原始串 T 中定位首个命中的归一化短语，返回原始串 [start,end)
  // （归一化空间去空格/标点/小写；映射回原文本以保留英文多词标签的大小写与空格）
  App._flFindFirstNorm = function (T, phrasesNorm) {
    const kept = []; let tnIdx = 0; const tnChars = [];
    for (let i = 0; i < T.length; i++) {
      const n = flNorm(T[i]);
      if (n.length) { tnChars.push(n); kept.push(tnIdx); tnIdx++; } else kept.push(-1);
    }
    const TN = tnChars.join('');
    for (const ph of phrasesNorm) {
      if (!ph) continue;
      const idx = TN.indexOf(ph);
      if (idx !== -1) {
        let s = -1, e = -1;
        for (let i = 0; i < T.length; i++) {
          if (kept[i] >= 0) { const k = kept[i]; if (k >= idx && s === -1) s = i; if (k < idx + ph.length) e = i; }
        }
        if (s !== -1 && e !== -1) return { phrase: ph, start: s, end: e + 1 };
      }
    }
    return null;
  };

  // 提交某字段内容（select 模糊匹配；textarea/email 直填）
  App._flCommit = function (fieldId, text) {
    if (!fieldId || !text || !text.trim()) return;
    const fld = this._flFieldById(fieldId);
    if (!fld) return;
    const el = document.getElementById(fld.id);
    if (!el) return;
    const val = text.trim();
    if (fld.type === 'select') {
      const hit = this._flMatchOption(fld, val);
      if (hit) { el.value = hit; el.dispatchEvent(new Event('change')); }
      else { this.toast(tr('未匹配到选项，请手动选择') + '：' + tr(fld.labelKey)); }
    } else {
      el.value = val;
      el.dispatchEvent(new Event('input'));
    }
  };

  // select 候选项模糊匹配：raw 值或翻译标签任一包含/被包含即命中
  App._flMatchOption = function (fld, seg) {
    if (!fld.opts) return null;
    const s = flNorm(seg);
    if (!s) return null;
    for (const o of fld.opts) {
      if (o.norm && (o.norm.includes(s) || s.includes(o.norm))) return o.raw;
      if (o.trn && (o.trn.includes(s) || s.includes(o.trn))) return o.raw;
    }
    return null;
  };

  // 字段命令词 → 字段对象
  App._flFieldByCmd = function (phrase) {
    for (const f of (this._flVoiceFields || [])) {
      if (f.cmdLocal === phrase || f.cmdZh === phrase) return f;
    }
    return null;
  };

  // 高亮当前目标字段
  App._flVoiceHighlight = function (activeId) {
    const fields = this._flVoiceFields || [];
    for (const fld of fields) {
      const g = document.getElementById('fl-g-' + fld.id);
      if (!g) continue;
      if (fld.id === activeId) { g.style.borderLeft = '4px solid #4f9dff'; g.style.background = 'rgba(79,157,255,0.10)'; }
      else { g.style.borderLeft = ''; g.style.background = ''; }
    }
  };

  // 更新状态面板文案（待命 / 正在录入某栏位）
  App._flVoiceSetState = function (state) {
    const s = document.getElementById('fl-vs-state');
    const tgt = document.getElementById('fl-vs-target');
    if (state === 'content' && this._flActiveField) {
      if (s) { s.textContent = tr('聆听中…'); s.style.color = '#5fe39b'; }
      if (tgt) tgt.textContent = tr('正在录入') + '：' + tr(this._flFieldById(this._flActiveField).labelKey) + '（' + tr('voice_complete_field') + '）';
    } else {
      if (s) { s.textContent = tr('待命'); s.style.color = '#5fe39b'; }
      if (tgt) tgt.textContent = tr('voice_wait_field');
    }
  };

  // 状态机：解析未处理文本，处理栏目指令 / 结束词
  // 'cmd' 状态等待栏目指令；'content' 状态聆听该栏位内容，遇结束词提交或遇新栏目指令则切换。
  App._flVoiceStep = function () {
    const unparsed = this._flFull.slice(this._flConsumed);
    if (!unparsed.trim()) return;
    const cmdPhrases = [];
    for (const f of (this._flVoiceFields || [])) { cmdPhrases.push(f.cmdLocal, f.cmdZh); }
    const endPhrases = (VOICE_END[getLang()] || []).map(flNorm).concat(['栏目完毕', '栏目结束'].map(flNorm));
    const cmdHit = this._flFindFirstNorm(unparsed, cmdPhrases);
    const endHit = this._flFindFirstNorm(unparsed, endPhrases);
    if (this._flState === 'cmd') {
      if (cmdHit) {
        const fld = this._flFieldByCmd(cmdHit.phrase);
        this._flActiveField = fld ? fld.id : null;
        this._flState = 'content';
        this._flConsumed = cmdHit.end;
        this._flVoiceHighlight(this._flActiveField);
        this._flVoiceSetState('content');
      }
      // cmd 状态下出现结束词（无活动字段）→ 视为噪声，忽略
    } else if (this._flState === 'content') {
      if (cmdHit && (!endHit || cmdHit.start < endHit.start)) {
        // 新栏目指令出现在结束词之前 → 先提交当前字段，再切入新字段
        const content = unparsed.slice(0, cmdHit.start).trim();
        this._flCommit(this._flActiveField, content);
        const fld = this._flFieldByCmd(cmdHit.phrase);
        this._flActiveField = fld ? fld.id : null;
        this._flConsumed = cmdHit.end;
        this._flVoiceHighlight(this._flActiveField);
        this._flVoiceSetState('content');
      } else if (endHit) {
        const content = unparsed.slice(0, endHit.start).trim();
        this._flCommit(this._flActiveField, content);
        this._flActiveField = null;
        this._flState = 'cmd';
        this._flConsumed = endHit.end;
        this._flVoiceHighlight(null);
        this._flVoiceSetState('cmd');
      }
    }
  };

  // 切换语音录入（开始 / 停止）
  App.flToggleVoice = function () {
    if (this._flVoiceActive) { this.flStopVoice(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { this.toast(tr('本设备不支持语音识别，请用键盘输入')); return; }
    if (!this._flVoiceFields) this._flBuildVoiceFields();
    this._flFull = '';
    this._flConsumed = 0;
    this._flActiveField = null;
    this._flState = 'cmd';
    const rec = new SR();
    rec.lang = VOICE_LANG[getLang()] || 'zh-CN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this._flFull += r[0].transcript;
        else interim += r[0].transcript;
      }
      const live = document.getElementById('fl-vs-live');
      if (live) live.textContent = (this._flFull.slice(this._flConsumed) + interim).slice(-240);
      this._flVoiceStep();
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech') { const s = document.getElementById('fl-vs-state'); if (s) s.textContent = tr('未听到语音，请重试'); return; }
      if (e.error === 'aborted') return;
      const s = document.getElementById('fl-vs-state'); if (s) s.textContent = tr('语音识别出错') + '：' + (e.error || '');
    };
    rec.onend = () => { if (this._flVoiceActive) { try { rec.start(); } catch (_) {} } }; // 弱网/静音自动续听
    this._flRec = rec;
    this._flVoiceActive = true;
    try { rec.start(); } catch (err) { this.toast(tr('无法启动语音') + '：' + err.message); this._flVoiceActive = false; return; }
    const btn = document.getElementById('fl-voice-btn');
    if (btn) { btn.innerHTML = '⏹ ' + tr('停止'); btn.classList.add('fl-voice-on'); }
    const bar = document.getElementById('fl-voice-status'); if (bar) bar.style.display = '';
    this._flVoiceSetState('cmd');
  };

  // 停止语音录入（提交未结内容后复位）
  App.flStopVoice = function () {
    if (this._flVoiceActive && this._flState === 'content' && this._flActiveField) {
      const unparsed = this._flFull.slice(this._flConsumed);
      if (unparsed.trim()) this._flCommit(this._flActiveField, unparsed.trim());
    }
    this._flVoiceActive = false;
    try { this._flRec && this._flRec.stop(); } catch (_) {}
    this._flRec = null;
    this._flActiveField = null;
    this._flState = 'cmd';
    const btn = document.getElementById('fl-voice-btn');
    if (btn) { btn.innerHTML = '🎤 ' + tr('语音录入'); btn.classList.remove('fl-voice-on'); }
    const s = document.getElementById('fl-vs-state'); if (s) s.textContent = tr('语音录入已停止');
    const tgt = document.getElementById('fl-vs-target'); if (tgt) tgt.textContent = '';
    for (const fld of (this._flVoiceFields || [])) {
      const g = document.getElementById('fl-g-' + fld.id);
      if (g) { g.style.borderLeft = ''; g.style.background = ''; }
    }
  };
}
