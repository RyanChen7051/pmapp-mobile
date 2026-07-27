/* ═══ Authentication ═══ */
import { SUPABASE_KEY, APP_VERSION, USER_MAP } from './config.js';
import { t } from './i18n.js';

export function setupAuth(App) {
  App.isLoggedIn = function() { return !!this.session; };
  App.isAdmin = function() { const r = this.session?.user?.role; const u = this.session?.user?.username; return r === 'admin' || (!r && (u === 'admin' || u === 'admin2')); };
  App.isSuperAdmin = function() { return this.session?.user?.username === 'admin'; };
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
    if (!email || !password) { errEl.textContent = t('err_empty'); return false; }
    if (!proxyUrl && (!SUPABASE_KEY || SUPABASE_KEY.startsWith('sb_secret_') || SUPABASE_KEY.startsWith('__'))) {
      errEl.innerHTML = 'PWA 未配置有效的 Publishable key。<br>请从 Supabase Dashboard 复制 Publishable key (sb_publishable_...)，然后运行仓库根目录的 <b>update_pwa_key.py</b> 脚本更新。<br><br>临时方案：可在下方「代理 URL」填入本地代理地址。';
      console.error('[LOGIN] Invalid SUPABASE_KEY:', SUPABASE_KEY.startsWith('__') ? 'placeholder' : (SUPABASE_KEY.startsWith('sb_secret_') ? 'secret key (not allowed in browser)' : 'empty'));
      return false;
    }
    btn.disabled = true; btn.textContent = t('login_loading'); errEl.textContent = '';
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
        throw new Error(t('err_notfound'));
      }
      console.log('[LOGIN] Found account:', acc.username, 'role:', acc.role, 'has plain pwd:', !!acc.password, 'has hash:', !!acc.password_hash);
      if (acc.status === 'inactive' || acc.is_active === 0 || acc.is_active === false) throw new Error(t('err_disabled'));
      const ok = await this.verifyPassword(password, acc.password_hash, acc.salt, acc.password);
      console.log('[LOGIN] Password verify result:', ok);
      if (!ok) throw new Error(t('err_pwd'));
      this.session = { user: { id: acc.id, email: email, username: acc.username, display_name: acc.display_name || acc.username, role: acc.role || ((acc.username === 'admin' || acc.username === 'admin2') ? 'admin' : 'viewer') } };
      localStorage.setItem('pmapp_session', JSON.stringify(this.session));
      await this.recordLogin(acc.username, acc.display_name || acc.username, acc.role || ((acc.username === 'admin' || acc.username === 'admin2') ? 'admin' : 'viewer'));
      this.loadSettings();
      this.loadHome();
      this.toast(t('t_login_ok'));
    } catch (err) {
      console.error('[LOGIN] Error:', err.message);
      const msg = err.message || t('t_login_fail');
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        errEl.textContent = t('t_network_err');
      } else {
        errEl.textContent = msg;
      }
    } finally {
      btn.disabled = false; btn.textContent = t('btn_login');
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
    if (!confirm(t('confirm_logout'))) return;
    localStorage.removeItem('pmapp_session');
    this.session = null;
    this.loadSettings();
    this.loadHome();
    this.toast(t('t_logout'));
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
      const [logRecords, userRecords] = await Promise.all([
        this.sbGet('sync_data', 'table_name=eq.pwa_login_log&is_deleted=eq.false&limit=500&order=updated_at.desc&select=payload,updated_at'),
        this.sbGet('sync_data', 'table_name=eq.users&is_deleted=eq.false&limit=200&select=payload,supabase_id,updated_at')
      ]);

      const logs = logRecords.map(r => {
        try {
          const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
          return p ? { ...p, _updated: r.updated_at } : null;
        } catch { return null; }
      }).filter(l => l && l.username);

      // Build user status map from users table
      const userStatusMap = {};
      userRecords.forEach(r => {
        try {
          const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
          if (p && p.username) {
            const ex = userStatusMap[p.username];
            if (!ex || (r.updated_at || '') > (ex._updated || '')) {
              userStatusMap[p.username] = { ...p, _sb_id: r.supabase_id, _updated: r.updated_at };
            }
          }
        } catch {}
      });

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
      let onlineCount = 0, loggedInCount = 0, activeCount = 0;

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

        // Get actual user status from users table
        const userRec = userStatusMap[key];
        const userStatus = userRec ? (userRec.status || 'active') : 'active';
        const isActive = userStatus === 'active';
        if (isActive) activeCount++;

        const nameColor = !isActive ? 'var(--text-muted)' : hasLoggedIn ? 'var(--accent-green)' : 'var(--accent)';
        const statusBadge = !isActive
          ? '<span class="badge badge-red">已停用</span>'
          : isOnlineNow
            ? '<span class="badge badge-green">在线</span>'
            : hasLoggedIn
              ? '<span class="badge badge-gray">已上线</span>'
              : '<span class="badge badge-red">未上线</span>';

        const timeStr = loginTime
          ? loginTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '—';
        const deptBadge = info.dept ? `<span class="badge badge-gray">${this.esc(info.dept)}</span>` : '';

        // Toggle button: admin can enable/disable any user
        const toggleBtn = isActive
          ? `<button onclick="App.toggleUserStatus('${key}')" style="margin-top:4px;font-size:10px;padding:3px 10px;border-radius:6px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-weight:600">停用</button>`
          : `<button onclick="App.toggleUserStatus('${key}')" style="margin-top:4px;font-size:10px;padding:3px 10px;border-radius:6px;border:1px solid var(--accent-green);background:var(--accent-green);color:#fff;cursor:pointer;font-weight:600">启用</button>`;

        return `<div class="card" style="padding:8px 12px;display:flex;align-items:center;justify-content:space-between;${!isActive ? 'opacity:0.6' : ''}">
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
            ${toggleBtn}
          </div>
        </div>`;
      }).join('');

      const summary = `<div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-bottom:8px">
        共 ${userKeys.length} 人 · <span style="color:var(--accent-green)">启用 ${activeCount}</span> · <span style="color:var(--accent)">停用 ${userKeys.length - activeCount}</span> · 🟢当前在线 ${onlineCount}
      </div>`;

      el.innerHTML = summary + rows;
    } catch (e) {
      el.innerHTML = `<div class="empty">加载失败: ${this.esc(e.message)}</div>`;
    }
  };

  /* ─── Toggle User Status (admin only) ─── */
  App.toggleUserStatus = async function(username) {
    try {
      const records = await this.sbGet('sync_data', 'table_name=eq.users&is_deleted=eq.false&limit=200&select=payload,supabase_id,updated_at');
      const users = records.map(r => {
        try {
          const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
          return p ? { ...p, _sb_id: r.supabase_id, _updated: r.updated_at } : null;
        } catch { return null; }
      }).filter(u => u && u.username);

      const userMap = {};
      users.forEach(u => {
        const ex = userMap[u.username];
        if (!ex || (u._updated || '') > (ex._updated || '')) userMap[u.username] = u;
      });
      const user = userMap[username];

      if (!user) {
        this.toast('找不到用户记录，无法操作');
        return;
      }

      const currentStatus = user.status || 'active';
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? '启用' : '停用';

      if (!confirm(`确认${action}用户 ${user.display_name || username}？`)) return;

      user.status = newStatus;
      user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = JSON.stringify(user);
      const nowISO = new Date().toISOString();

      await this.sbPatch('sync_data', `supabase_id=eq.${user._sb_id}`, {
        payload, updated_at: nowISO, device_id: this.deviceId
      });

      this.toast(`已${action} ${user.display_name || username}`);
      this.loadLoginActivity();
    } catch (e) {
      this.toast('操作失败: ' + e.message);
    }
  };

  /* ─── Change Password (all users) ─── */
  App.showChangePassword = function() {
    const html = `<div class="modal-handle"></div><div class="modal-title">修改密码</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">账号 ${this.esc(this.session.user.username)} 的密码将被变更</div>
      <div class="input-group"><label>原密码</label><input type="password" id="cp-old" placeholder="********" autocomplete="current-password"></div>
      <div class="input-group"><label>新密码</label><input type="password" id="cp-new" placeholder="至少 6 位" autocomplete="new-password"></div>
      <div class="input-group"><label>确认新密码</label><input type="password" id="cp-confirm" placeholder="再次输入新密码" autocomplete="new-password"></div>
      <button class="btn btn-primary" onclick="App.changePassword()">确认变更</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
  };

  App.changePassword = async function() {
    const oldPwd = document.getElementById('cp-old').value;
    const newPwd = document.getElementById('cp-new').value;
    const confirmPwd = document.getElementById('cp-confirm').value;

    if (!oldPwd || !newPwd || !confirmPwd) { this.toast('请填写所有字段'); return; }
    if (newPwd !== confirmPwd) { this.toast('两次输入的新密码不一致'); return; }
    if (newPwd.length < 6) { this.toast('新密码至少 6 位'); return; }
    if (newPwd === oldPwd) { this.toast('新密码不能与原密码相同'); return; }

    try {
      const records = await this.sbGet('sync_data', 'table_name=eq.users&is_deleted=eq.false&limit=200&select=payload,supabase_id,updated_at');
      const users = records.map(r => {
        try {
          const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
          return p ? { ...p, _sb_id: r.supabase_id, _updated: r.updated_at } : null;
        } catch { return null; }
      }).filter(u => u && u.username);

      const userMap = {};
      users.forEach(u => {
        const ex = userMap[u.username];
        if (!ex || (u._updated || '') > (ex._updated || '')) userMap[u.username] = u;
      });
      const user = userMap[this.session.user.username];

      if (!user) { this.toast('找不到用户记录'); return; }

      // Verify old password
      const ok = await this.verifyPassword(oldPwd, user.password_hash, user.salt, user.password);
      if (!ok) { this.toast('原密码不正确'); return; }

      // Hash new password with PBKDF2 + random salt
      const salt = this.uuid().substring(0, 16);
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(newPwd), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
      const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Update user record: set hash+salt, remove plain text password
      user.password_hash = hash;
      user.salt = salt;
      delete user.password;
      user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const payload = JSON.stringify(user);
      const nowISO = new Date().toISOString();
      await this.sbPatch('sync_data', `supabase_id=eq.${user._sb_id}`, {
        payload, updated_at: nowISO, device_id: this.deviceId
      });

      this.closeModal();
      this.toast('密码已变更，下次登入请使用新密码');
    } catch (e) {
      this.toast('变更失败: ' + e.message);
    }
  };
}
