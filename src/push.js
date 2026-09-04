/* ═══ Web Push（Apple Watch 镜像通知路径 A）═══ */
import { VAPID_PUBLIC } from './config.js';
import { tr } from './i18n.js';

export function setupPush(App) {
  const TABLE = 'push_subscriptions';

  const urlBase64ToUint8Array = (b64) => {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  };

  const rawToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

  App.pushSupported =
    ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);

  App.pushStatus = function () {
    if (!App.pushSupported) return 'unsupported';
    try { return Notification.permission; } catch { return 'unsupported'; }
  };

  // 把订阅写入 Supabase（按 endpoint upsert，避免重复）
  const saveSubscription = async (sub) => {
    const payload = {
      endpoint: sub.endpoint,
      p256dh: rawToB64(sub.getKey('p256dh')),
      auth: rawToB64(sub.getKey('auth')),
      device_id: App.deviceId || '',
      username: App.session?.user?.username || '',
      created_at: new Date().toISOString(),
    };
    const resp = await fetch(`${App.apiBaseUrl()}/${TABLE}?on_conflict=endpoint`, {
      method: 'POST',
      headers: { ...App.sbHeaders('return=minimal'), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`${tr('保存订阅失败')} ${resp.status} ${txt.substring(0, 120)}`);
    }
  };

  // 用户手动启用（必须在用户手势中调用，iOS 才会弹权限框）
  App.enablePush = async function () {
    if (!App.pushSupported) { this.toast(tr('当前浏览器不支持推送')); return false; }
    let perm = Notification.permission;
    if (perm === 'denied') { this.toast(tr('通知权限已被系统拒绝，请到 iPhone 设置中开启')); return false; }
    if (perm === 'default') {
      try { perm = await Notification.requestPermission(); }
      catch { this.toast(tr('请求通知权限失败')); return false; }
      if (perm !== 'granted') { this.toast(tr('未授予通知权限')); return false; }
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }
      await saveSubscription(sub);
      this.toast(tr('✅ 推送通知已启用'));
      this.renderPushSettings();
      return true;
    } catch (e) {
      console.error('enablePush', e);
      this.toast(tr('订阅失败: ') + (e.message || e));
      return false;
    }
  };

  // 关闭推送：取消订阅 + 删除服务端记录
  App.disablePush = async function () {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        await fetch(`${App.apiBaseUrl()}/${TABLE}?endpoint=eq.${encodeURIComponent(endpoint)}`, {
          method: 'DELETE', headers: App.sbHeaders(),
        }).catch(() => {});
      }
      this.toast(tr('已关闭推送通知'));
      this.renderPushSettings();
    } catch (e) { this.toast(tr('关闭失败: ') + (e.message || e)); }
  };

  // 设置页面板渲染
  App.renderPushSettings = function () {
    const panel = document.getElementById('push-panel');
    if (!panel) return;
    if (!App.pushSupported) {
      panel.innerHTML = `<div class="setting-row"><span class="setting-label">${tr('推送通知')}</span><span class="setting-value" style="color:#94a3b8">${tr('此浏览器不支持')}</span></div>`;
      return;
    }
    const perm = App.pushStatus();
    let statusText, btn;
    if (perm === 'denied') {
      statusText = tr('已拒绝（去系统设置开启）');
      btn = `<button class="btn btn-secondary" disabled style="opacity:.5">${tr('已拒绝')}</button>`;
    } else if (perm === 'granted') {
      statusText = tr('已启用 ✅');
      btn = `<button class="btn btn-secondary" onclick="App.disablePush()">${tr('关闭推送')}</button>`;
    } else {
      statusText = tr('未启用');
      btn = `<button class="btn btn-primary" onclick="App.enablePush()">${tr('启用推送')}</button>`;
    }
    panel.innerHTML = `
      <div class="setting-row"><span class="setting-label">${tr('推送通知')}</span><span class="setting-value" id="push-status">${statusText}</span></div>
      <div style="padding:0 12px 8px">${btn}
        <div style="font-size:11px;color:#94a3b8;margin-top:6px">${tr('启用后，PMApp 的关键提醒会推送到 iPhone，并自动镜像到 Apple Watch。')}</div>
      </div>`;
  };

  // 启动后若已授权，则静默确保订阅存在（用于换设备/订阅过期自愈）
  App.ensurePushSubscription = async function () {
    if (!App.pushSupported) return;
    if (Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }
      await saveSubscription(sub);
    } catch (e) { console.warn('ensurePushSubscription', e); }
  };
}
