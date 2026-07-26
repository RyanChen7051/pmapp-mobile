/* ═══ Supabase Client — API helpers ═══ */
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { t } from './i18n.js';

export function setupSupabaseClient(App) {
  App.getProxyUrl = function() { return localStorage.getItem('pmapp_proxy_url') || ''; };

  App.saveProxyUrl = function() {
    const url = document.getElementById('proxy-url-input').value.trim();
    if (!url) { this.toast(t('err_empty')); return; }
    localStorage.setItem('pmapp_proxy_url', url);
    document.getElementById('set-proxy').textContent = url;
    this.toast(t('t_proxy_saved'));
  };

  App.clearProxyUrl = function() {
    localStorage.removeItem('pmapp_proxy_url');
    document.getElementById('set-proxy').textContent = '-';
    document.getElementById('proxy-url-input').value = '';
    this.toast(t('t_proxy_cleared'));
  };

  App.apiBaseUrl = function() {
    const proxy = this.getProxyUrl();
    if (proxy) return proxy.replace(/\/$/, '') + '/rest/v1';
    return SUPABASE_URL + '/rest/v1';
  };

  App.uuid = function() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  App.sbHeaders = function(prefer) {
    const h = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (prefer) h['Prefer'] = prefer;
    return h;
  };

  App.sbGet = async function(table, query) {
    const resp = await fetch(`${this.apiBaseUrl()}/${table}?${query || ''}`, { headers: this.sbHeaders() });
    if (!resp.ok) throw new Error(`GET ${table}: ${resp.status}`);
    return resp.json();
  };

  App.sbPost = async function(table, data) {
    const resp = await fetch(`${this.apiBaseUrl()}/${table}`, {
      method: 'POST', headers: this.sbHeaders('return=representation'), body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      throw new Error(`POST ${table}: ${resp.status} ${errBody.substring(0, 200)}`);
    }
    return resp.json();
  };

  App.sbPatch = async function(table, query, data) {
    const resp = await fetch(`${this.apiBaseUrl()}/${table}?${query}`, {
      method: 'PATCH', headers: this.sbHeaders('return=minimal'), body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`PATCH ${table}: ${resp.status}`);
  };
}
