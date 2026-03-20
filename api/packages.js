// OPI — Omnikarai Package Index
// GET  /api/packages          — list all packages
// GET  /api/packages?q=query  — search packages
// GET  /api/packages/:name    — get package info
// POST /api/packages          — publish a package  { name, version, description, author, files }
// GET  /api/packages/:name/download — download latest tarball info

// In-memory store (Vercel KV or Edge Config would replace this in production)
// For now we use a simple JSON file stored in /tmp or returned statically.
// Real storage: replace PACKAGES with Vercel KV calls.

const REGISTRY_KEY = "opi_registry_v1";

// Built-in seed packages so the registry isn't empty on first load
const SEED_PACKAGES = [
  {
    name: "math_extra",
    version: "1.0.0",
    description: "Extended math functions for Omnikarai: factorial, combinations, statistics",
    author: "Fraziym Tech",
    license: "MIT",
    keywords: ["math", "statistics", "factorial"],
    homepage: "https://opi.vercel.app",
    downloads: 42,
    published_at: "2026-03-01T00:00:00Z",
    files: []
  },
  {
    name: "stringx",
    version: "1.2.0",
    description: "Extended string manipulation: reverse, pad, repeat, title_case, snake_case",
    author: "Fraziym Tech",
    license: "MIT",
    keywords: ["string", "text", "format"],
    homepage: "https://opi.vercel.app",
    downloads: 87,
    published_at: "2026-03-05T00:00:00Z",
    files: []
  },
  {
    name: "vectors",
    version: "0.9.0",
    description: "2D/3D vector math for Omnikarai — dot, cross, normalize, lerp",
    author: "Fraziym Tech",
    license: "MIT",
    keywords: ["vector", "math", "3d", "linear-algebra"],
    homepage: "https://opi.vercel.app",
    downloads: 19,
    published_at: "2026-03-10T00:00:00Z",
    files: []
  }
];

// Simple in-process store (persists across warm invocations on same instance)
let _registry = null;

function getRegistry() {
  if (!_registry) _registry = [...SEED_PACKAGES];
  return _registry;
}

function ok(res, data, status = 200) {
  res.status(status).json(data);
}

function err(res, message, status = 400) {
  res.status(status).json({ error: message });
}

export default function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { method, query, body } = req;
  const registry = getRegistry();

  // Route: GET /api/packages or GET /api/packages?q=...
  // Route: GET /api/packages/:name
  // Route: POST /api/packages
  const pathParts = (req.url || "").replace(/^\/api\/packages\/?/, "").split("/").filter(Boolean);
  const pkgName   = pathParts[0];
  const action    = pathParts[1]; // "download"

  // ── GET ──────────────────────────────────────────────────────────────────
  if (method === "GET") {

    // GET /api/packages/:name/download
    if (pkgName && action === "download") {
      const pkg = registry.find(p => p.name === pkgName);
      if (!pkg) return err(res, `Package '${pkgName}' not found`, 404);
      pkg.downloads = (pkg.downloads || 0) + 1;
      return ok(res, {
        name:    pkg.name,
        version: pkg.version,
        files:   pkg.files || [],
        download_url: `https://opi.vercel.app/api/packages/${pkg.name}/tarball`
      });
    }

    // GET /api/packages/:name
    if (pkgName) {
      const pkg = registry.find(p => p.name === pkgName);
      if (!pkg) return err(res, `Package '${pkgName}' not found`, 404);
      return ok(res, pkg);
    }

    // GET /api/packages?q=query
    const q = (query.q || "").toLowerCase().trim();
    let results = registry;
    if (q) {
      results = registry.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.author || "").toLowerCase().includes(q) ||
        (p.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    }

    return ok(res, {
      total:    results.length,
      packages: results.map(p => ({
        name:        p.name,
        version:     p.version,
        description: p.description,
        author:      p.author,
        license:     p.license,
        keywords:    p.keywords,
        downloads:   p.downloads,
        published_at: p.published_at
      }))
    });
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (method === "POST") {
    const { name, version, description, author, license, keywords, files, token } = body || {};

    if (!name)    return err(res, "Field 'name' is required");
    if (!version) return err(res, "Field 'version' is required");

    // Basic name validation
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name))
      return err(res, "Package name must be lowercase letters, numbers, - or _ (max 64 chars)");

    // Check for existing package (same name + version = conflict)
    const existing = registry.find(p => p.name === name && p.version === version);
    if (existing) return err(res, `Package '${name}@${version}' already exists`, 409);

    // Remove old versions of same package (keep only latest)
    const idx = registry.findIndex(p => p.name === name);
    const pkg = {
      name,
      version,
      description: description || "",
      author:      author || "unknown",
      license:     license || "MIT",
      keywords:    keywords || [],
      files:       files || [],
      downloads:   0,
      published_at: new Date().toISOString()
    };

    if (idx >= 0) registry[idx] = pkg;
    else registry.push(pkg);

    return ok(res, { success: true, message: `Published ${name}@${version}` }, 201);
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (method === "DELETE" && pkgName) {
    const idx = registry.findIndex(p => p.name === pkgName);
    if (idx < 0) return err(res, `Package '${pkgName}' not found`, 404);
    registry.splice(idx, 1);
    return ok(res, { success: true, message: `Deleted '${pkgName}'` });
  }

  return err(res, "Method not allowed", 405);
}
