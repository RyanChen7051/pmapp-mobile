/* ═══ Translate Module: On-demand message translation ═══
 * Overseas employees post in their own language; viewers can translate on click.
 * Uses Google Translate (free, no key) with MyMemory fallback.
 * Translations are cached in localStorage.
 */
import { getLang } from './i18n.js';

const CACHE_PREFIX = 'pmapp_trans_';
const CACHE_LIMIT = 500;

// Simple hash for cache key (djb2)
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function getCached(text, targetLang) {
  try {
    return localStorage.getItem(CACHE_PREFIX + hashStr(text) + '_' + targetLang);
  } catch { return null; }
}

function setCached(text, targetLang, translation) {
  try {
    localStorage.setItem(CACHE_PREFIX + hashStr(text) + '_' + targetLang, translation);
    // Trim cache if too large
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    if (keys.length > CACHE_LIMIT) {
      keys.slice(0, keys.length - CACHE_LIMIT).forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

/**
 * Translate text to target language (defaults to current UI language).
 * @returns {Promise<string>} translated text
 * @throws {Error} if all providers fail
 */
export async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  targetLang = targetLang || getLang() || 'en';

  // Check cache
  const cached = getCached(text, targetLang);
  if (cached) return cached;

  // Provider 1: Google Translate (unofficial, free, auto-detect source)
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='
      + targetLang + '&dt=t&q=' + encodeURIComponent(text);
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data[0])) {
        const translated = data[0].map(seg => seg[0] || '').join('');
        if (translated) {
          setCached(text, targetLang, translated);
          return translated;
        }
      }
    }
  } catch (e) {
    console.warn('[translate] Google endpoint failed:', e.message);
  }

  // Provider 2: MyMemory (free, CORS-friendly, supports LangDetect)
  try {
    const url = 'https://api.mymemory.translated.net/get?q='
      + encodeURIComponent(text) + '&langpair=LangDetect|' + targetLang;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        if (translated && translated.toUpperCase() !== 'PLEASE SELECT TWO DISTINCT LANGUAGES') {
          setCached(text, targetLang, translated);
          return translated;
        }
      }
    }
  } catch (e) {
    console.warn('[translate] MyMemory fallback failed:', e.message);
  }

  throw new Error('TRANSLATE_FAILED');
}

/** Clear all cached translations. Returns count removed. */
export function clearTranslateCache() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  } catch { return 0; }
}

export function setupTranslate(App) {
  // Expose for global onclick usage
  App.translateText = translateText;
  App.clearTranslateCache = clearTranslateCache;

  // Clear translation cache with toast feedback
  App.doClearTransCache = function() {
    const count = clearTranslateCache();
    const msg = (App.t ? App.t('t_trans_cleared') : 'Cache cleared') + ' (' + count + ' ' + (App.t ? App.t('t_trans_count') : 'items') + ')';
    if (App.toast) App.toast(msg);
  };

  /**
   * Toggle translation display for a message.
   * @param {HTMLElement} btn - the translate button element
   * @param {string|number} msgId - unique message id
   */
  App.toggleTranslate = async function(btn, msgId) {
    const transEl = document.getElementById('trans-' + msgId);
    if (!transEl) return;

    // Resolve original content from the message-board cache (avoids passing
    // raw text through the HTML attribute, which broke inline JSON quoting).
    const msg = (this.cache.message_board || []).find(x => x.id === msgId);
    const content = msg ? (msg.content || '') : '';
    if (!content) return;

    // If translation is visible -> hide
    if (transEl.style.display !== 'none' && transEl.innerHTML) {
      transEl.style.display = 'none';
      btn.textContent = '\u{1F310} ' + (App.t ? App.t('btn_translate') : 'Translate');
      btn.classList.remove('trans-active');
      return;
    }

    // Check cache -> instant show
    const cached = getCached(content, getLang());
    if (cached) {
      transEl.innerHTML = '<span class="trans-label">' + (App.t ? App.t('translation_label') : 'Translation')
        + '</span> ' + this.esc(cached);
      transEl.style.display = 'block';
      btn.textContent = '\u{1F310} ' + (App.t ? App.t('btn_hide_trans') : 'Hide');
      btn.classList.add('trans-active');
      return;
    }

    // Fetch translation
    const origText = btn.textContent;
    btn.textContent = '\u{1F310} ' + (App.t ? App.t('translating') : '...');
    btn.classList.add('trans-loading');

    try {
      const translated = await translateText(content, getLang());
      transEl.innerHTML = '<span class="trans-label">' + (App.t ? App.t('translation_label') : 'Translation')
        + '</span> ' + this.esc(translated);
      transEl.style.display = 'block';
      btn.textContent = '\u{1F310} ' + (App.t ? App.t('btn_hide_trans') : 'Hide');
      btn.classList.add('trans-active');
    } catch (e) {
      btn.textContent = '\u{1F310} ' + (App.t ? App.t('trans_fail') : 'Failed');
      setTimeout(() => { btn.textContent = origText; }, 2000);
    } finally {
      btn.classList.remove('trans-loading');
    }
  };
}
