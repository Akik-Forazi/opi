// opi.js — shared dynamic JavaScript for OPI
'use strict';

const API = 'https://opi-nine.vercel.app/api';

// ─── AUTH ────────────────────────────────────────────────────────────────────
const Auth = {
  getToken() { return localStorage.getItem('opi_token'); },
  setToken(t) { localStorage.setItem('opi_token', t); },
  clearToken() { localStorage.removeItem('opi_token'); localStorage.removeItem('opi_user'); },
  getUser() { try { return JSON.parse(localStorage.getItem('opi_user') || 'null'); } catch { return null; } },
  setUser(u) { localStorage.setItem('opi_user', JSON.stringify(u)); },
  isLoggedIn() { return !!this.getToken(); },
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this.getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },
  async fetchUser() {
    if (!this.getToken()) return null;
    const r = await fetch(`${API}/auth/me`, { headers: this.headers() });
    if (!r.ok) { this.clearToken(); return null; }
    const u = await r.json();
    this.setUser(u);
    return u;
  },
  async logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', headers: this.headers() }).catch(() => {});
    this.clearToken();
    window.location.href = '/';
  }
};

// ─── API HELPERS ─────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    headers: Auth.headers(opts.headers || {}),
    ...opts
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n || 0);
}
function elapsed(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30)  return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

// ─── SIMPLE MARKDOWN → HTML ───────────────────────────────────────────────────
function md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/```[\w]*\n([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs,'<ul>$1</ul>')
    .replace(/\n\n+/g,'</p><p>')
    .replace(/^(?!<[h1-6uolpbr])/gm,'');
}

// ─── PKG CARD ─────────────────────────────────────────────────────────────────
function pkgCard(p) {
  return `
  <a class="pkg-card" href="/package/${esc(p.name)}">
    <div>
      <span class="pkg-card-name">${esc(p.name)}</span>
      <span class="pkg-card-ver">v${esc(p.latest || p.version || '')}</span>
    </div>
    <p class="pkg-card-desc">${esc(p.description)}</p>
    <div class="pkg-card-meta">
      <span>⬇ ${fmt(p.total_downloads || p.downloads || 0)}</span>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;justify-content:flex-end">
        ${(p.keywords || []).slice(0,3).map(k=>`<span class="tag">${esc(k)}</span>`).join('')}
      </div>
    </div>
  </a>`;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function renderNav() {
  const nav = qs('#nav');
  if (!nav) return;
  const user = Auth.getUser();
  const page = window.location.pathname;

  nav.innerHTML = `
  <div class="nav-inner">
    <a class="nav-logo" href="/"><span>OPI</span></a>
    <div class="nav-search">
      <form id="nav-search-form">
        <input id="nav-q" type="text" placeholder="Search packages…"
          value="${esc(new URLSearchParams(location.search).get('q') || '')}">
        <button type="submit">Search</button>
      </form>
    </div>
    <div class="nav-links" id="nav-links"></div>
  </div>`;

  const links = qs('#nav-links');
  links.innerHTML = `<a href="/search">Packages</a><a href="/help">Docs</a>`;

  if (user) {
    links.innerHTML += `
    <div class="nav-dropdown">
      <div class="nav-avatar" id="nav-avatar">${esc((user.display_name || user.username)[0].toUpperCase())}</div>
      <div class="nav-dropdown-menu" id="nav-menu">
        <a href="/dashboard">📦 Dashboard</a>
        <a href="/user/${esc(user.username)}">👤 Profile</a>
        <a href="/settings">⚙️ Settings</a>
        <hr>
        <a href="#" class="danger" id="nav-logout">Sign out</a>
      </div>
    </div>`;
    qs('#nav-avatar').onclick = () => qs('#nav-menu').classList.toggle('open');
    qs('#nav-logout').onclick = e => { e.preventDefault(); Auth.logout(); };
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-dropdown')) qs('#nav-menu')?.classList.remove('open');
    });
  } else {
    links.innerHTML += `<a href="/login">Sign in</a><a href="/register" class="nav-btn">Register</a>`;
  }

  qs('#nav-search-form').onsubmit = e => {
    e.preventDefault();
    const q = qs('#nav-q').value.trim();
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function renderFooter() {
  const f = qs('#footer');
  if (!f) return;
  f.innerHTML = `
  <p style="margin-bottom:.4rem">
    <a href="/">OPI</a> ·
    <a href="/search">Packages</a> ·
    <a href="/help">Docs</a> ·
    <a href="${API}/stats" target="_blank">API</a>
  </p>
  <p>Fraziym Tech &amp; AI · Omnikarai Package Index · opi-nine.vercel.app</p>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Hydrate user from server if token exists but no cached user
  if (Auth.getToken() && !Auth.getUser()) await Auth.fetchUser();
  renderNav();
  renderFooter();
  if (typeof pageInit === 'function') pageInit();
});
