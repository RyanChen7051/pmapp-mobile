/* ═══ Authentication ═══ */
import { SUPABASE_KEY, APP_VERSION, USER_MAP, MODULE_PERMISSIONS, REPORTS_ALL_USERS } from './config.js';
import { t, tr } from './i18n.js';

export function setupAuth(App) {
  const ADMIN_USERS = ['admin', 'admin2', 'admin3', 'admin4'];
  const SUPER_ADMIN_USERS = ['admin'];

  App.isLoggedIn = function() { return !!this.session; };
  App.isAdmin = function() { const r = this.session?.user?.role; const u = this.session?.user?.username; return r === 'admin' || (!r && ADMIN_USERS.includes(u)); };
  App.isSuperAdmin = function() { const u = this.session?.user?.username; return SUPER_ADMIN_USERS.includes(u); };
  App.isViewer = function() { return this.session?.user?.role === 'viewer'; };

  /* ─── 模块级编辑权限（精确权限模型）───
     管理员 admin(超级管理员)：可看、可改、可调整结构。
     管理员 admin2/admin3/admin4(受限管理员)：UI 与 admin 完全一致，但写入被拦截（只读模式）。
     其余用户(viewer)：纯查看，无编辑 UI。
     => 可见性用 isAdmin()；实际写入统一用 canEdit()，仅超级管理员为真。 */
  App.canEdit = function(module) {
    if (this.isSuperAdmin()) return true;
    // 现场记录：admin2 与 admin 同权可写入（驻点人员账号使用，admin2 也能新建/编辑/保存）
    if (module === 'field_log') {
      const u = this.session?.user?.username;
      if (u === 'admin2') return true;
    }
    return false;
  };

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
      errEl.innerHTML = tr('PWA 未配置有效的 Publishable key。<br>请从 Supabase Dashboard 复制 Publishable key (sb_publishable_...)，然后运行仓库根目录的 <b>update_pwa_key.py</b> 脚本更新。<br><br>临时方案：可在下方「代理 URL」填入本地代理地址。');
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
      this.session = { user: { id: acc.id, email: email, username: acc.username, display_name: acc.display_name || acc.username, role: acc.role || (ADMIN_USERS.includes(acc.username) ? 'admin' : 'viewer') } };
      // 记录登录当天的中国日期，用于「当日有效、次日需重新登录」判定
      this.session.loginDate = this.chinaDate();
      localStorage.setItem('pmapp_session', JSON.stringify(this.session));
      this.scheduleChinaLogout();
      await this.recordLogin(acc.username, acc.display_name || acc.username, acc.role || (ADMIN_USERS.includes(acc.username) ? 'admin' : 'viewer'));
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

  /* ─── Session Guard: 当日有效 + 中国时间 23:59 自动登出 + 网络重连自动登入 ─── */

  // 当前中国日期 (Asia/Shanghai = UTC+8, 无夏令时)，格式 YYYY-MM-DD
  App.chinaDate = function() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  };

  // 会话是否为「当天」有效（登录当天中国日期 == 当前中国日期）
  App.isSessionValidToday = function() {
    if (!this.session || !this.session.loginDate) return false;
    return this.session.loginDate === this.chinaDate();
  };

  // 安排一个定时器：到中国时间当晚 23:59 强制登出
  App.scheduleChinaLogout = function() {
    clearTimeout(this._logoutTimer);
    if (!this.isLoggedIn() || !this.isSessionValidToday()) return;
    const now = new Date();
    const [y, m, d] = this.chinaDate().split('-').map(Number);
    // 中国 23:59 = UTC 15:59（同一日历日，UTC+8）
    let target = Date.UTC(y, m - 1, d, 23, 59, 0, 0) - 8 * 3600 * 1000;
    let delay = target - now.getTime();
    if (delay <= 0) {
      // 已过今日 23:59（中国时间），顺延到次日
      target = Date.UTC(y, m - 1, d + 1, 23, 59, 0, 0) - 8 * 3600 * 1000;
      delay = target - now.getTime();
    }
    this._logoutTimer = setTimeout(() => this.forceAutoLogout(), delay);
  };

  // 强制登出（无确认弹窗，用于定时/自动场景）
  App.forceAutoLogout = function(reason) {
    if (!this.isLoggedIn()) { this.scheduleChinaLogout(); return; }
    localStorage.removeItem('pmapp_session');
    this.session = null;
    this.toast(reason || t('auto_logout_night'), 3500);
    this.navigate('settings'); // 重新渲染登录表单（loadSettings 依赖 isLoggedIn）
    this.scheduleChinaLogout(); // 重新安排下一次（在登录前为 no-op）
  };

  // 启动守卫：定时登出 + 网络在线自动重登 / 离线提示
  App.setupSessionGuard = function() {
    this.scheduleChinaLogout();
    const self = this;
    window.addEventListener('online', () => {
      if (self.isLoggedIn() && self.isSessionValidToday()) {
        // 已登录且当日有效：网络恢复后自动重新载入数据（即"自动登入"）
        self.toast(t('reconnected'), 2000);
        self.loadAll().catch(() => {});
      } else if (!self.isLoggedIn()) {
        // 会话已失效（如跨天）：确保在登录页
        self.loadSettings();
        if (self.currentPage === 'settings') self.navigate('settings');
      }
    });
    window.addEventListener('offline', () => {
      self.toast(t('offline'), 2500);
    });
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
      this.toast(tr('登录记录写入失败: ') + e.message, 4000);
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
          ? `<span class="badge badge-red">${tr('已停用')}</span>`
          : isOnlineNow
            ? `<span class="badge badge-green">${tr('在线')}</span>`
            : hasLoggedIn
              ? `<span class="badge badge-gray">${tr('已上线')}</span>`
              : `<span class="badge badge-red">${tr('未上线')}</span>`;

        const timeStr = loginTime
          ? loginTime.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '—';
        const deptBadge = info.dept ? `<span class="badge badge-gray">${this.esc(tr(info.dept))}</span>` : '';

        // Toggle button: admin can enable/disable any user
        const toggleBtn = isActive
          ? `<button onclick="App.toggleUserStatus('${key}')" style="margin-top:4px;font-size:10px;padding:3px 10px;border-radius:6px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-weight:600">${tr('停用')}</button>`
          : `<button onclick="App.toggleUserStatus('${key}')" style="margin-top:4px;font-size:10px;padding:3px 10px;border-radius:6px;border:1px solid var(--accent-green);background:var(--accent-green);color:#fff;cursor:pointer;font-weight:600">${tr('启用')}</button>`;

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
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${tr('登录')} ${count} ${tr('次')}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${timeStr}</div>
            ${toggleBtn}
          </div>
        </div>`;
      }).join('');

      const summary = `<div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-bottom:8px">
        ${tr('共')} ${userKeys.length} ${tr('人')} · <span style="color:var(--accent-green)">${tr('启用')} ${activeCount}</span> · <span style="color:var(--accent)">${tr('停用')} ${userKeys.length - activeCount}</span> · 🟢${tr('当前在线')} ${onlineCount}
      </div>`;

      el.innerHTML = summary + rows;
    } catch (e) {
      el.innerHTML = `<div class="empty">${tr('加载失败: ')}${this.esc(e.message)}</div>`;
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
        this.toast(tr('找不到用户记录，无法操作'));
        return;
      }

      const currentStatus = user.status || 'active';
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? tr('启用') : tr('停用');

      if (!confirm(`${tr('确认')}${action}${tr('用户')} ${user.display_name || username}？`)) return;

      user.status = newStatus;
      user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = JSON.stringify(user);
      const nowISO = new Date().toISOString();

      await this.sbPatch('sync_data', `supabase_id=eq.${user._sb_id}`, {
        payload, updated_at: nowISO, device_id: this.deviceId
      });

      this.toast(`${action} ${user.display_name || username}`);
      this.loadLoginActivity();
    } catch (e) {
      this.toast(tr('操作失败: ') + e.message);
    }
  };

  /* ─── Change Password (all users) ─── */
  App.showChangePassword = function() {
    const html = `<div class="modal-handle"></div><div class="modal-title">${tr('修改密码')}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">${tr('账号')} ${this.esc(this.session.user.username)} ${tr('的密码将被变更')}</div>
      <div class="input-group"><label>${tr('原密码')}</label><input type="password" id="cp-old" placeholder="********" autocomplete="current-password"></div>
      <div class="input-group"><label>${tr('新密码')}</label><input type="password" id="cp-new" placeholder="${tr('至少 6 位')}" autocomplete="new-password"></div>
      <div class="input-group"><label>${tr('确认新密码')}</label><input type="password" id="cp-confirm" placeholder="${tr('再次输入新密码')}" autocomplete="new-password"></div>
      <button class="btn btn-primary" onclick="App.changePassword()">${tr('确认变更')}</button>
      <div style="height:10px"></div>
      <button class="btn btn-secondary" onclick="App.closeModal()">${tr('取消')}</button>`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('show');
  };

  App.changePassword = async function() {
    const oldPwd = document.getElementById('cp-old').value;
    const newPwd = document.getElementById('cp-new').value;
    const confirmPwd = document.getElementById('cp-confirm').value;

    if (!oldPwd || !newPwd || !confirmPwd) { this.toast(tr('请填写所有字段')); return; }
    if (newPwd !== confirmPwd) { this.toast(tr('两次输入的新密码不一致')); return; }
    if (newPwd.length < 6) { this.toast(tr('新密码至少 6 位')); return; }
    if (newPwd === oldPwd) { this.toast(tr('新密码不能与原密码相同')); return; }

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

      if (!user) { this.toast(tr('找不到用户记录')); return; }

      // Verify old password
      const ok = await this.verifyPassword(oldPwd, user.password_hash, user.salt, user.password);
      if (!ok) { this.toast(tr('原密码不正确')); return; }

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
      this.toast(tr('密码已变更，下次登入请使用新密码'));
    } catch (e) {
      this.toast(tr('变更失败: ') + e.message);
    }
  };
}
