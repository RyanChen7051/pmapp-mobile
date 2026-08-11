/* ═══ Offline Sync Queue — local-first store-and-forward ═══
   断网时把写操作先存进本地(localStorage outbox)，联网后自动补发到 Supabase。
   包装 App.sbPost / App.sbPatch / App.sbGet 三个入口，覆盖全部模块。
   零新增成本：本地队列 = 设备浏览器，云端 = 现有 Supabase(免费)。
*/
import { t } from './i18n.js';

const OUTBOX_KEY = 'pmapp_outbox';

export function setupSyncQueue(App) {
  // ── 本地队列读写 ──
  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function writeOutbox(arr) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function genId() {
    return 'op-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }
  function online() { return navigator.onLine !== false; }

  App.enqueueOp = function(op) {
    const arr = readOutbox();
    arr.push(op);
    writeOutbox(arr);
    this.updateSyncBadge();
  };
  App.dequeueOp = function(id) {
    const arr = readOutbox().filter(o => o.id !== id);
    writeOutbox(arr);
    this.updateSyncBadge();
  };

  // 顶部栏「待同步 N」标识 — v3.16.0 同时驱动悬浮按钮
  App.updateSyncBadge = function() {
    const n = readOutbox().length;
    // 兼容旧 nav bar 内的 sync-badge（CSS 已隐藏，DOM 保留）
    const oldEl = document.getElementById('sync-badge');
    if (oldEl) {
      if (n > 0) { oldEl.style.display = ''; oldEl.textContent = (this.t('sync_pending') || '待同步') + ' ' + n; }
      else { oldEl.style.display = 'none'; }
    }
    // v3.16.0 主显示：悬浮同步按钮的角标
    const fabEl = document.getElementById('sync-fab-badge');
    if (fabEl) {
      if (n > 0) { fabEl.style.display = 'flex'; fabEl.textContent = n > 99 ? '99+' : String(n); }
      else { fabEl.style.display = 'none'; }
    }
  };

  // ── 自动补发引擎 ──
  let flushing = false;
  App.flushSyncQueue = async function() {
    if (flushing) return;
    if (!online()) return;
    const arr = readOutbox();
    if (!arr.length) return;
    flushing = true;
    let done = 0;
    try {
      arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // FIFO
      for (const op of arr) {
        if (!online()) break;
        try {
          if (op.op === 'post') await _sbPost(op.table, op.data);
          else if (op.op === 'patch') await _sbPatch(op.table, op.query, op.data);
          this.dequeueOp(op.id);
          done++;
        } catch (e) {
          // 任一条失败则停止，保留剩余待重试（避免乱序）
          break;
        }
      }
    } finally {
      flushing = false;
      this.updateSyncBadge();
      if (done > 0) {
        try { this.toast((this.t('sync_done') || '已同步') + ' (' + done + ')'); } catch (e) {}
        try { this.loadAll(); } catch (e) {}
      }
    }
  };

  // ── 包装原始网络函数（保留副本用于补发）──
  const _sbPost = App.sbPost.bind(App);
  const _sbPatch = App.sbPatch.bind(App);
  const _sbGet = App.sbGet.bind(App);

  App.sbPost = async function(table, data) {
    if (!online()) {
      this.enqueueOp({ id: genId(), op: 'post', table, data, createdAt: Date.now() });
      return { ...(data || {}), _pending: true };
    }
    try {
      return await _sbPost(table, data);
    } catch (e) {
      // 在线但瞬时失败（网络抖动/超时）→ 同样入队兜底
      this.enqueueOp({ id: genId(), op: 'post', table, data, createdAt: Date.now() });
      return { ...(data || {}), _pending: true };
    }
  };

  App.sbPatch = async function(table, query, data) {
    if (!online()) {
      this.enqueueOp({ id: genId(), op: 'patch', table, query, data, createdAt: Date.now() });
      return { _pending: true };
    }
    try {
      return await _sbPatch(table, query, data);
    } catch (e) {
      this.enqueueOp({ id: genId(), op: 'patch', table, query, data, createdAt: Date.now() });
      return { _pending: true };
    }
  };

  // 读操作：离线时直接返回空，避免 saveRecord 的存在性检查抛错卡住创建流程
  App.sbGet = async function(table, query) {
    if (!online()) return [];
    return _sbGet(table, query);
  };

  // ── 触发时机 ──
  // 1) 网络恢复
  window.addEventListener('online', () => { App.updateSyncBadge(); App.flushSyncQueue(); });
  // 2) 页面重新可见（从后台切回 / 锁屏解锁）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') App.flushSyncQueue();
  });
  // 3) 定时兜底
  setInterval(() => { App.flushSyncQueue(); }, 20000);
  // 4) 启动后尝试补发（覆盖「App 关闭期间已联网」的情况）
  setTimeout(() => { App.updateSyncBadge(); App.flushSyncQueue(); }, 1500);
}
