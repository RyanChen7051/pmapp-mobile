/* ═══ Data Loading ═══ */
import { MODULES } from './config.js';

export function setupData(App) {
  App.fetchSyncData = async function(tableName, limit) {
    try {
      const data = await this.sbGet('sync_data', `table_name=eq.${tableName}&is_deleted=eq.false&order=updated_at.desc&limit=${limit || 500}&select=payload,local_id,supabase_id,updated_at`);
      const map = {};
      data.forEach(d => {
        try {
          const payload = typeof d.payload === 'string' ? JSON.parse(d.payload) : d.payload;
          if (payload && payload.id) {
            if (!map[d.local_id] || (d.updated_at || '') > (map[d.local_id]._updated || '')) {
              map[d.local_id] = { ...payload, _updated: d.updated_at, _sb_id: d.supabase_id };
            }
          }
        } catch {}
      });
      return Object.values(map).sort((a, b) => (b._updated || '').localeCompare(a._updated || ''));
    } catch (e) { console.error(`Load ${tableName}:`, e); return []; }
  };

  App.loadAll = async function() {
    const tables = [...Object.keys(MODULES), 'message_board'];
    await Promise.allSettled(tables.map(t => this.fetchSyncData(t).then(data => { this.cache[t] = data; })));
    this.loadHome();
  };
}
