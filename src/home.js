/* ═══ Home Page + Message Board ═══ */
import { STAGE_PROGRESS, MODULES, APP_VERSION } from './config.js';

export function setupHome(App) {
  App.loadHome = function() {
    const banner = document.getElementById('home-banner');
    if (!this.isLoggedIn()) {
      banner.innerHTML = '<div class="banner banner-warn">⚠️ 尚未登录 — 前往「设定」登录以启用编辑功能</div>';
    } else if (this.isViewer()) {
      banner.innerHTML = '<div class="banner banner-info">👁 只读模式 — 您可查看数据及留言</div>';
    } else if (this.isAdmin()) {
      banner.innerHTML = '<div class="banner banner-ok">👑 管理员模式 — 可编辑所有数据</div>';
    }

    const projects = this.cache.projects || [];
    const issues = this.cache.issues || [];
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('ds-total').textContent = projects.length;
    document.getElementById('ds-active').textContent = projects.filter(p => p.status === 'active').length;
    document.getElementById('ds-overdue').textContent = projects.filter(p => p.delivery_date && p.delivery_date < today && !['completed', 'cancelled'].includes(p.status)).length;
    document.getElementById('ds-qc').textContent = projects.filter(p => p.stage === 'PVT' || p.stage === 'DVT').length;
    document.getElementById('ds-pending').textContent = issues.filter(i => i.status === 'open').length;

    const projEl = document.getElementById('home-projects');
    const activeProjects = projects.filter(p => p.status === 'active').slice(0, 5);
    if (activeProjects.length === 0) {
      projEl.innerHTML = '<div class="empty"><div class="empty-icon">📦</div>暂无进行中项目</div>';
    } else {
      projEl.innerHTML = activeProjects.map(p => {
        const progress = STAGE_PROGRESS[p.stage] || 0;
        const pColor = progress >= 75 ? 'var(--accent-green)' : progress >= 50 ? 'var(--accent-orange)' : 'var(--accent-blue)';
        return `<div class="card" onclick="App.openProjectDetail(${p.id})">
          <div class="card-title">📦 ${this.esc(p.name)}</div>
          <div class="card-meta">
            ${p.stage ? `<span class="badge badge-purple">${this.esc(p.stage)}</span>` : ''}
            ${p.customer_name_zh ? `<span>👤 ${this.esc(p.customer_name_zh)}</span>` : ''}
            ${p.delivery_date ? `<span>📅 ${this.esc(p.delivery_date)}</span>` : ''}
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;background:${pColor}"></div></div>
        </div>`;
      }).join('');
    }

    const newsEl = document.getElementById('home-news');
    const news = (this.cache.ai_industry_news || []).slice(0, 5);
    if (news.length === 0) {
      newsEl.innerHTML = '<div class="empty"><div class="empty-icon">📰</div>暂无行业动态</div>';
    } else {
      newsEl.innerHTML = news.map(n => `<div class="card" onclick="App.openDetail('ai_industry_news', ${n.id})">
        <div class="card-title">📰 ${this.esc(n.title)}</div>
        ${n.summary ? `<div style="font-size:12px;color:var(--text-secondary);margin:4px 0;line-height:1.5">${this.esc(n.summary.substring(0,80))}${n.summary.length>80?'...':''}</div>` : ''}
        <div class="card-meta">
          ${n.news_date ? `<span>📅 ${this.esc(n.news_date)}</span>` : ''}
          ${n.importance ? `<span class="badge ${this.badgeClass(n.importance)}">${this.esc(n.importance)}</span>` : ''}
          ${n.source ? `<span>📌 ${this.esc(n.source)}</span>` : ''}
          ${n.url ? `<a href="${this.esc(n.url)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent-blue);font-size:12px;text-decoration:none">查看原文 ↗</a>` : ''}
        </div></div>`).join('');
    }

    if (this.isLoggedIn()) {
      const nameEl = document.getElementById('msg-name');
      if (nameEl && !nameEl.value) nameEl.value = this.session.user.display_name || this.session.user.username || '';
    }
    this.renderMessages();

    const adminSection = document.getElementById('admin-login-section');
    if (adminSection) {
      if (this.isAdmin()) {
        adminSection.style.display = '';
        this.loadLoginActivity();
      } else {
        adminSection.style.display = 'none';
      }
    }
  };

  App.renderMessages = async function() {
    if (!this.cache.message_board) {
      this.cache.message_board = await this.fetchSyncData('message_board');
    }
    const messages = (this.cache.message_board || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const el = document.getElementById('msg-list');
    if (messages.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">💬</div>暂无留言</div>';
      return;
    }
    el.innerHTML = messages.map(m => `<div class="msg-item">
      <div class="msg-head">
        <span class="msg-name">${this.esc(m.name || '匿名')}</span>
        <span class="msg-time">${this.esc(m.created_at || '')}</span>
      </div>
      <div class="msg-content">${this.esc(m.content || '')}</div>
      ${this.isAdmin() ? `<div class="msg-delete" onclick="App.deleteMessage(${m.id})">删除</div>` : ''}
    </div>`).join('');
  };

  App.postMessage = async function() {
    const nameEl = document.getElementById('msg-name');
    const contentEl = document.getElementById('msg-content');
    const name = nameEl.value.trim();
    const content = contentEl.value.trim();
    if (!name) { this.toast('请输入姓名'); return; }
    if (!content) { this.toast('请输入留言内容'); return; }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id = Math.floor(Date.now() / 1000);
    try {
      await this.sbPost('sync_data', {
        table_name: 'message_board', local_id: id,
        payload: JSON.stringify({ id, name, content, created_at: now }),
        supabase_id: this.uuid(),
        is_deleted: false, updated_at: new Date().toISOString(), device_id: this.deviceId,
      });
      contentEl.value = '';
      this.cache.message_board = await this.fetchSyncData('message_board');
      this.renderMessages();
      this.toast('留言已发布');
    } catch (e) { this.toast('发布失败: ' + e.message); }
  };

  App.deleteMessage = async function(id) {
    if (!confirm('确定删除此留言？')) return;
    try {
      const records = await this.sbGet('sync_data', `table_name=eq.message_board&is_deleted=eq.false&select=supabase_id,payload`);
      const rec = records.find(r => { try { const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload; return p && p.id === id; } catch { return false; } });
      if (rec) {
        await this.sbPatch('sync_data', `supabase_id=eq.${rec.supabase_id}`, { is_deleted: true, updated_at: new Date().toISOString() });
      }
      this.cache.message_board = await this.fetchSyncData('message_board');
      this.renderMessages();
      this.toast('已删除');
    } catch (e) { this.toast('删除失败: ' + e.message); }
  };
}
