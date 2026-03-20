// GET  /api/packages         — list / search all packages
// POST /api/packages         — publish a new package
import { getRegistry } from './_registry.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const registry = getRegistry();

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const q = ((req.query && req.query.q) || '').toLowerCase().trim();
    let results = registry;
    if (q) {
      results = registry.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.keywords || []).some(k => k.toLowerCase().includes(q))
      );
    }
    return res.status(200).json({
      total: results.length,
      packages: results
    });
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, version, description, author, license, keywords } = req.body || {};
    if (!name)    return res.status(400).json({ error: "Field 'name' is required" });
    if (!version) return res.status(400).json({ error: "Field 'version' is required" });
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name))
      return res.status(400).json({ error: "Invalid package name" });

    const exists = registry.find(p => p.name === name && p.version === version);
    if (exists) return res.status(409).json({ error: `${name}@${version} already exists` });

    const idx = registry.findIndex(p => p.name === name);
    const pkg = {
      name, version,
      description: description || '',
      author: author || 'unknown',
      license: license || 'MIT',
      keywords: keywords || [],
      files: [],
      downloads: 0,
      published_at: new Date().toISOString()
    };
    if (idx >= 0) registry[idx] = pkg;
    else registry.push(pkg);

    return res.status(201).json({ success: true, message: `Published ${name}@${version}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
