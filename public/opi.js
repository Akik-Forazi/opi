/* ═══════════════════════════════════════════════════════════
   OPI — Shared JS  (Fraziym aesthetic × GitHub structure)
   ═══════════════════════════════════════════════════════════ */
'use strict';

const API = 'https://opi-nine.vercel.app/api';

/* ── Auth ─────────────────────────────────────────────────── */
const Auth = {
  getToken() { return localStorage.getItem('opi_token'); },
  setToken(t) { localStorage.setItem('opi_token', t); },
  clearToken() { localStorage.removeItem('opi_token'); localStorage.removeItem('opi_user'); },
  getUser()  { try { return JSON.parse(localStorage.getItem('opi_user') || 'null'); } catch { return null; } },
  setUser(u) { localStorage.setItem('opi_user', JSON.stringify(u)); },
  isLoggedIn() { return !!this.getToken(); },
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this.getToken(); if (t) h['Authorization'] = `Bearer ${t}`; return h;
  },
  async fetchUser() {
    if (!this.getToken()) return null;
    const r = await fetch(`${API}/auth/me`, { headers: this.headers() });
    if (!r.ok) { this.clearToken(); return null; }
    const u = await r.json(); this.setUser(u); return u;
  },
  async logout() {
    await fetch(`${API}/auth/logout`, { method:'POST', headers:this.headers() }).catch(()=>{});
    this.clearToken(); window.location.href = '/';
  }
};

/* ── API helper ─────────────────────────────────────────────── */
async function api(path, opts = {}) {
  try {
    const r = await fetch(`${API}${path}`, { headers: Auth.headers(opts.headers || {}), ...opts });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch(e) {
    return { ok: false, status: 0, data: { error: e.message } };
  }
}

/* ── Utils ──────────────────────────────────────────────────── */
const qs  = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (a, b) => Math.random() * (b - a) + a;

function fmt(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return String(n);
}
function elapsed(iso) {
  if (!iso) return 'unknown';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'today'; if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d/30)}mo ago`;
  return `${Math.floor(d/365)}y ago`;
}
function md(text) {
  if (!text) return '';
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
    .replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>')
    .replace(/\n\n+/g,'</p><p>');
}

/* ── PKG CARD HTML ────────────────────────────────────────── */
function pkgCard(p){
  const kws=(p.keywords||[]).slice(0,3).map(k=>`<a href="/search?q=${encodeURIComponent(k)}" class="tag" style="font-size:.65rem">${esc(k)}</a>`).join('');
  return `<a class="pkg-card" href="/package/${esc(p.name)}">
    <div class="pkg-card-top">
      <span class="pkg-card-name">${esc(p.name)}</span>
      <span class="pkg-card-ver badge badge-dim">v${esc(p.latest||p.version||'')}</span>
    </div>
    <p class="pkg-card-desc">${esc(p.description)}</p>
    <div class="pkg-card-foot">
      <span style="display:flex;align-items:center;gap:.3rem">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style="opacity:.6"><path d="M7.47 1.76a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L8.75 4.06V14a.75.75 0 0 1-1.5 0V4.06L4.28 7.07A.75.75 0 0 1 3.22 6L7.47 1.76Z"/></svg>
        ${fmt(p.total_downloads||p.downloads||0)}
      </span>
      <div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:flex-end">${kws}</div>
    </div>
  </a>`;
}

/* ── NAV ──────────────────────────────────────────────────── */
function renderNav(){
  const nav=qs('#nav'); if(!nav) return;
  const user=Auth.getUser();
  const q=new URLSearchParams(location.search).get('q')||'';
  nav.innerHTML=`
  <div class="nav-inner">
    <a class="nav-logo" href="/">
      <div class="nav-logo-icon">O</div>
      <span>OPI</span>
    </a>
    <div class="nav-search">
      <form id="nsf">
        <input id="nq" type="text" placeholder="Search packages…" value="${esc(q)}" autocomplete="off">
        <button type="submit" aria-label="Search">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>
        </button>
      </form>
    </div>
    <nav class="nav-links" id="nav-links">
      <a href="/search">Packages</a>
      <a href="/help">Docs</a>
      ${user
        ? `<div class="nav-dropdown">
            <div class="nav-avatar" id="nav-av" title="${esc(user.username)}">${esc((user.display_name||user.username)[0].toUpperCase())}</div>
            <div class="nav-drop-menu" id="nav-menu">
              <a href="/dashboard">📦 Dashboard</a>
              <a href="/user/${esc(user.username)}">👤 Profile</a>
              <a href="/settings">⚙️ Settings</a>
              <hr>
              <a href="#" class="danger" id="nav-out">Sign out</a>
            </div>
          </div>`
        : `<a href="/login" style="color:var(--muted)">Sign in</a><a href="/register" class="btn btn-primary btn-sm nav-btn" style="margin-left:.25rem">Register</a>`
      }
    </nav>
    <button class="nav-hamburger" id="nav-hb" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>`;

  qs('#nsf').onsubmit=e=>{
    e.preventDefault();
    const v=qs('#nq').value.trim();
    location.href=`/search?q=${encodeURIComponent(v)}`;
  };
  qs('#nav-hb').onclick=()=>{
    qs('#nav-links').classList.toggle('open');
  };
  if(user){
    qs('#nav-av').onclick=e=>{e.stopPropagation();qs('#nav-menu').classList.toggle('open')};
    qs('#nav-out').onclick=e=>{e.preventDefault();Auth.logout()};
    document.addEventListener('click',()=>qs('#nav-menu')?.classList.remove('open'));
  }
}

/* ── FOOTER ───────────────────────────────────────────────── */
function renderFooter(){
  const f=qs('#footer'); if(!f) return;
  f.innerHTML=`
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
          <div class="nav-logo-icon" style="width:24px;height:24px;font-size:.65rem">O</div>
          <span style="font-family:var(--mono);font-weight:700;font-size:.78rem;letter-spacing:.14em">OPI</span>
        </div>
        <p>The official package index for the Omnikarai language. Native x86-64 speed, zero runtime overhead.</p>
        <div class="footer-status">
          <span class="status-dot-live"></span>
          <span>All systems operational</span>
        </div>
      </div>
      <div class="footer-col">
        <h4>Registry</h4>
        <a href="/search">Browse packages</a>
        <a href="/search?q=math">Math</a>
        <a href="/search?q=string">String</a>
        <a href="/search?q=data">Data</a>
      </div>
      <div class="footer-col">
        <h4>Developers</h4>
        <a href="/help">Documentation</a>
        <a href="/help#api">REST API</a>
        <a href="/help#toml">omnikarai.toml</a>
        <a href="/help#tokens">API tokens</a>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <a href="/register">Register</a>
        <a href="/login">Sign in</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Fraziym Tech &amp; AI · Omnikarai Package Index</span>
      <span><a href="/help#terms" style="color:var(--dim)">Terms</a> · <a href="${API}/stats" target="_blank" rel="noopener" style="color:var(--dim)">API Status</a></span>
    </div>
  </div>`;
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async ()=>{
  // background layers
  const bg=document.createElement('div'); bg.className='opi-bg'; document.body.prepend(bg);
  const gr=document.createElement('div'); gr.className='opi-bg-grid'; document.body.prepend(gr);
  if(Auth.getToken()&&!Auth.getUser()) await Auth.fetchUser();
  renderNav(); renderFooter();
  if(typeof pageInit==='function') pageInit();
});

/* ── Package card ─────────────────────────────────────────── */
function pkgCard(p) {
  const kw = (p.keywords||[]).slice(0,3).map(k=>`<span class="tag">${esc(k)}</span>`).join('');
  return `
  <a class="pkg-card" href="/package/${esc(p.name)}">
    <div class="pkg-card-top">
      <span class="pkg-card-name">${esc(p.name)}</span>
      <span class="pkg-card-ver">v${esc(p.latest||p.version||'')}</span>
    </div>
    <p class="pkg-card-desc">${esc(p.description)}</p>
    <div class="pkg-card-foot">
      <span style="display:flex;align-items:center;gap:.3rem">
        <span style="color:var(--acc-l)">⬇</span> ${fmt(p.total_downloads||0)}
      </span>
      <div style="display:flex;gap:.3rem;flex-wrap:wrap">${kw}</div>
    </div>
  </a>`;
}

/* ── Background effects ────────────────────────────────────── */
function initBG() {
  ['bg-grid','bg-aurora','bg-scan'].forEach(cls => {
    if (qs('.' + cls)) return;
    const d = document.createElement('div');
    d.className = cls; document.body.prepend(d);
  });

  // Floating particles canvas
  if (qs('#fz-particles')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'fz-particles';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.45;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize(); addEventListener('resize', resize, {passive:true});
  const COLS = ['rgba(164,139,255,','rgba(90,180,255,','rgba(77,240,200,'];
  const pts = Array.from({length: Math.min(50, Math.floor(innerWidth/24))}, () => ({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:rand(.4,1.5), vx:rand(-.15,.15), vy:rand(-.12,.12),
    a:rand(.1,.4), c:COLS[Math.floor(Math.random()*COLS.length)]
  }));
  (function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0) p.x=canvas.width; if(p.x>canvas.width) p.x=0;
      if(p.y<0) p.y=canvas.height; if(p.y>canvas.height) p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c+p.a+')'; ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

/* ── Scroll reveal ─────────────────────────────────────────── */
function initReveal() {
  const els = qsa('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(e=>e.classList.add('visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);} });
  }, {threshold:.08, rootMargin:'0px 0px -24px 0px'});
  els.forEach(e => io.observe(e));
}

/* ── 3D card tilt (Fraziym-style) ─────────────────────────── */
function initTilt() {
  qsa('[data-tilt], .card-feature').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `perspective(600px) rotateX(${(-y*6).toFixed(1)}deg) rotateY(${(x*6).toFixed(1)}deg) scale(1.018)`;
      card.style.transition = 'transform .08s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .35s ease';
    });
  });
}

/* ── Pointer light ─────────────────────────────────────────── */
function initPointerLight() {
  const targets = '.card, .pkg-card, .stat';
  document.addEventListener('mousemove', e => {
    const box = e.target.closest(targets);
    if (!box) return;
    const r = box.getBoundingClientRect();
    box.style.setProperty('--px', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
    box.style.setProperty('--py', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
  }, {passive:true});
  const s = document.createElement('style');
  s.textContent = `.card:hover,.pkg-card:hover,.stat:hover{background-image:radial-gradient(circle at var(--px,50%) var(--py,50%),rgba(139,107,255,.07) 0%,transparent 60%);}`;
  document.head.appendChild(s);
}

/* ── Nav ────────────────────────────────────────────────────── */
function renderNav() {
  const nav = qs('#nav'); if (!nav) return;
  const user = Auth.getUser();
  const q = new URLSearchParams(location.search).get('q') || '';

  nav.innerHTML = `
  <div class="nav-inner">
    <a class="nav-logo" href="/">
      <div class="nav-logo-icon">📦</div>
      <span class="nav-logo-text">OPI</span>
    </a>
    <div class="nav-search">
      <form id="nsf">
        <input id="nq" type="text" placeholder="Search packages…" value="${esc(q)}" autocomplete="off">
        <button type="submit">Search</button>
      </form>
    </div>
    <nav class="nav-links" id="nav-links">
      <a href="/search">Packages</a>
      <a href="/help">Docs</a>
      <div id="nav-auth"></div>
    </nav>
    <button class="nav-mobile-toggle" id="nav-toggle" aria-expanded="false" aria-label="Menu">☰ Menu</button>
  </div>`;

  // Auth section
  const authEl = qs('#nav-auth');
  if (user) {
    authEl.innerHTML = `
    <div class="nav-dropdown" id="nav-dd">
      <div class="nav-avatar" id="nav-av" title="@${esc(user.username)}">${esc((user.display_name||user.username)[0].toUpperCase())}</div>
      <div class="nav-dropdown-menu" id="nav-menu">
        <div style="padding:.6rem 1rem .5rem;font-size:.78rem;color:var(--muted);border-bottom:1px solid var(--line)">
          @${esc(user.username)}
        </div>
        <a href="/dashboard">📦 Dashboard</a>
        <a href="/user/${esc(user.username)}">👤 Your profile</a>
        <a href="/settings">⚙️ Settings</a>
        <hr>
        <a href="#" class="danger" id="nav-logout">Sign out</a>
      </div>
    </div>`;
    qs('#nav-av').onclick = e => { e.stopPropagation(); qs('#nav-menu').classList.toggle('open'); };
    qs('#nav-logout').onclick = e => { e.preventDefault(); Auth.logout(); };
    document.addEventListener('click', () => qs('#nav-menu')?.classList.remove('open'));
  } else {
    authEl.innerHTML = `<a href="/login">Sign in</a><a href="/register" class="nav-btn">Register</a>`;
  }

  // Search
  qs('#nsf').onsubmit = e => {
    e.preventDefault();
    const v = qs('#nq').value.trim();
    window.location.href = v ? `/search?q=${encodeURIComponent(v)}` : '/search';
  };

  // Mobile toggle
  const toggle = qs('#nav-toggle');
  const links  = qs('#nav-links');
  toggle.onclick = () => {
    const open = links.classList.toggle('open');
    toggle.textContent = open ? '✕ Close' : '☰ Menu';
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  // Scroll class
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
}

/* ── Footer ─────────────────────────────────────────────────── */
function renderFooter() {
  const f = qs('#footer'); if (!f) return;
  f.innerHTML = `
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div style="font-family:var(--mono);font-size:.8rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--fg);display:flex;align-items:center;gap:.5rem">
          <span style="background:linear-gradient(135deg,#8b6bff,#5b35e6);width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.85rem">📦</span>
          OPI
        </div>
        <p>Official package registry for Omnikarai — native x86-64 speed, zero runtime.</p>
        <div class="footer-status">
          <span class="status-dot"></span>All systems operational
        </div>
      </div>
      <div class="footer-col">
        <h4>Registry</h4>
        <a href="/search">Browse packages</a>
        <a href="/search?q=math">Math packages</a>
        <a href="/search?q=string">String packages</a>
        <a href="${API}/stats" target="_blank">API stats</a>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <a href="/register">Create account</a>
        <a href="/login">Sign in</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="/help">Documentation</a>
        <a href="/help#api">REST API</a>
        <a href="/help#toml">omnikarai.toml</a>
        <a href="/help#terms">Terms</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Fraziym Tech &amp; AI · Omnikarai Package Index</span>
      <span style="display:flex;gap:1rem">
        <a href="/">OPI</a> · <a href="/help">Docs</a> · <a href="${API}/stats">API</a>
      </span>
    </div>
  </div>`;
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (Auth.getToken() && !Auth.getUser()) await Auth.fetchUser();
  initBG();
  renderNav();
  renderFooter();
  initReveal();
  initTilt();
  initPointerLight();
  if (typeof pageInit === 'function') pageInit();
});
