/* ═══ Authentication ═══ */
import { SUPABASE_KEY, APP_VERSION, USER_MAP } from './config.js';

export function setupAuth(App) {
  App.isLoggedIn = function() { return !!this.session; };
  App.isAdmin = function() { const r = this.session?.user?.role; const u = this.session?.user?.username; return r === 'admin' || (!r && u === 'admin'); };
  App.isViewer = function() { return this.session?.user?.role === 'viewer'; };

  App.login = async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const proxyInput = document.getElementById('login-proxy-url');
    const proxyUrl = proxyInput ? proxyInput.value.trim() : '';
    if (proxyUrl) {
      localStorage.setItem('pmapp_proxy_url', proxyUrl);
      console.log('[LOGIN] Using proxy URL:', proxyUrl);
    }
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    if (!email || !password) { errEl.textContent = '请输入用户名和密码'; return false; }
    if (!proxyUrl && (!SUPABASE_KEY || SUPABASE_KEY.startsWith('sb_secret_') || SUPABASE_KEY.startsWith('__'))) {
      errEl.innerHTML = 'PWA 未配置有效的 Publishable key。<br>请从 Supabase Dashboard 复制 Publishable key (sb_publishable_...)，然后运行仓库根目录的 <b>update_pwa_key.py</b> 脚本更新。<br><br>临时方案：可在下方「代理 URL」填入本地代理地址。';
      console.error('[LOGIN] Invalid SUPABASE_KEY:', SUPABASE_KEY.startsWith('__') ? 'placeholder' : (SUPABASE_KEY.startsWith('sb_secret_') ? 'secret key (not allowed in browser)' : 'empty'));
      return false;
    }
    btn.disabled = true; btn.textContent = '登录中...'; errEl.textContent = '';
    try {
      console.log('[LOGIN] Starting login for:', email, 'version:', APP_VERSION);
      const userRecords = await this.sbGet('sync_data', `table_name=eq.users&is_deleted=eq.false&limit=200&select=payload`);
      console.log('[LOGIN] Fetched records:', userRecords.length);
      const users = userRecords.map(r => { try { return typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload; } catch { return null; } }).filter(u => u && u.username);
      console.log('[LOGIN] Users with username:', users.length, 'usernames:', users.map(u => u.username).slice(0, 10));
      const userMap = {};
      users.forEach(u => { const ex = userMap[u.username]; if (!ex || (u.updated_at || '') > (ex.updated_at || '')) userMap[u.username] = u; });
      const acc = Object.values(userMap).find(u => u.username === email || u.email === email);
      if (!acc) {
        console.log('[LOGIN] Account not found. Available:', Object.keys(userMap));
        throw new Error('账号不存在');
      }
      console.log('[LOGIN] Found account:', acc.username, 'role:', acc.role, 'has plain pwd:', !!acc.password, 'has hash:', !!acc.password_hash);
      if (acc.status === 'inactive' || acc.is_active === 0 || acc.is_active === false) throw new Error('账号已被禁用');
      const ok = await this.verifyPassword(password, acc.password_hash, acc.salt, acc.password);
      console.log('[LOGIN] Password verify result:', ok);
      if (!ok) throw new Error('密码错误');
      this.session = { user: { id: acc.id, email: email, username: acc.username, display_name: acc.display_name || acc.username, role: acc.role || (acc.username === 'admin' ? 'admin' : 'viewer') } };
      localStorage.setItem('pmapp_session', JSON.stringify(this.session));
      await this.recordLogin(acc.username, acc.display_name || acc.username, acc.role || (acc.username === 'admin' ? 'admin' : 'viewer'));
      this.loadSettings();
      this.loadHome();
      this.toast('登录成功');
    } catch (err) {
      console.error('[LOGIN] Error:', err.message);
      const msg = err.message || '登录失败';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        errEl.textContent = '网络连接失败，请检查网络后重试';
      } else {
        errEl.textContent = msg;
      }
    } finally {
      btn.disabled = false; btn.textContent = '登录';
    }
    return false;
  };

  App.verifyPassword = async function(password, storedHash, salt, plainPassword) {
    try {
      if (plainPassword) return password === plainPassword;
      if (!storedHash) return true;
      if (!salt || salt === '') {
        const enc = new TextEncoder();
        const digest = await crypto.subtle.digest('SHA-256', enc.encode(password));
        return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('') === storedHash;
      }
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
      return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('') === storedHash;
    } catch (e) { return false; }
  };

  App.logout = function() {
    if (!confirm('确定要退出登录吗？')) return;
    localStorage.removeItem('pmapp_session');
    this.session = null;
    this.loadSettings();
    this.loadHome();
    this.toast('已退出登录');
  };

  App.recordLogin = async function(username, displayName, role) {
    try {
      const nowISO = new Date().toISOString();
      const ts = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        username: username,
        display_name: displayName || username,
        role: role || 'viewer',
        login_time: nowISO,
        device_id: this.deviceId,
        user_agent: navigator.userAgent.substring(0, 120)
      });
      await this.sbPost('sync_data', {
        table_name: 'pwa_login_log',
        local_id: ts,
        payload: payload,
        supabase_id: this.uuid(),
        is_deleted: false,
        updated_at: nowISO,
        device_id: this.deviceId
      });
      console.log('[LOGIN] Login activity recorded for:', username);
    } catch (e) {
      console.error('[LOGIN] Failed to record login activity:', e.message);
      this.toast('登录记录写入失败: ' + e.message, 4000);
    }
  };

  App.loadLoginActivity = async function() {
    const el = document.getElementById('admin-login-list');
    if (!el) return;
    try {
      const records = await this.sbGet('sync_data', 'table_name=eq.pwa_login_log&is_deleted=eq.false&limit=500&order=updated_at.desc&select=payload,updated_at');
      const logs = records.map(r => {
        try {
          const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
          return p ? { ...p, _updated: r.updated_at } : null;
        } catch { return null; }
      }).filter(l => l && l.username);

      const lastLoginMap = {};
      const countMap = {};
      logs.forEach(l => {
        const u = l.username;
        if (!lastLoginMap[u] || (l.login_time || '') > (lastLoginMap[u].login_time || '')) {
          lastLoginMap[u] = l;
        }
        countMap[u] = (countMap[u] || 0) + 1;
      });

      const now = Date.now();
      const userKeys = Object.keys(USER_MAP);
      let onlineCount = 0, loggedInCount = 0;

      const rows = userKeys.map((key, idx) => {
        const info = USER_MAP[key];
        const lastLog = lastLoginMap[key];
        const count = countMap[key] || 0;
        const hasLoggedIn = count > 0;
        if (hasLoggedIn) loggedInCount++;
        const loginTime = lastLog && lastLog.login_time ? new Date(lastLog.login_time) : null;
        const minsAgo = loginTime ? Math.floor((now - loginTime.getTime()) / 60000) : 9999;
        const isOnlineNow = minsAgo < 30;
        if (isOnlineNow) onlineCount++;

        const nameColor = hasLoggedIn ? 'var(--accent-green)' : 'var(--accent)';
        const statusBadge = isOnlineNow
          ? '<span class="badge badge-green">🟢 在线</span>'
          : hasLoggedIn
            ? '<span class="badge badge-gray">已上线</span>'
            : '<span class="badge badge-red">未上线</span>';

        const timeStr = loginTime
          ? loginTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '—';
        const deptBadge = info.dept ? `<span class="badge badge-gray">${this.esc(info.dept)}</span>` : '';

        return `<div class="card" style="padding:8px 12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
            <span style="color:var(--text-muted);font-size:12px;width:18px;text-align:center">${idx + 1}</span>
            <div style="min-width:0">
              <div style="font-weight:600;font-size:14px;color:${nameColor}">${this.esc(info.name)}</div>
              <div class="card-meta" style="margin-top:1px">
                ${deptBadge}
                <span style="font-size:10px;color:var(--text-muted)">${this.esc(key)}</span>
              </div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${statusBadge}
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">登录 ${count} 次</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${timeStr}</div>
          </div>
        </div>`;
      }).join('');

      const summary = `<div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-bottom:8px">
        共 ${userKeys.length} 人 · <span style="color:var(--accent-green)">已上线 ${loggedInCount}</span> · <span style="color:var(--accent)">未上线 ${userKeys.length - loggedInCount}</span> · 🟢当前在线 ${onlineCount}
      </div>`;

      el.innerHTML = summary + rows;
    } catch (e) {
      el.innerHTML = `<div class="empty">加载失败: ${this.esc(e.message)}</div>`;
    }
  };
}
