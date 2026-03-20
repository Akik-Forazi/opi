// GET /api/packages/[name]  — get single package info
// GET /api/packages/[name]/download — increment download count + return info
import { getRegistry } from '../_registry.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const registry = getRegistry();
  const { name } = req.query;

  if (!name) return res.status(400).json({ error: 'Package name required' });

  const pkg = registry.find(p => p.name === name);
  if (!pkg) return res.status(404).json({ error: `Package '${name}' not found` });

  if (req.method === 'GET') {
    pkg.downloads = (pkg.downloads || 0) + 1;
    return res.status(200).json(pkg);
  }

  if (req.method === 'DELETE') {
    const idx = registry.findIndex(p => p.name === name);
    registry.splice(idx, 1);
    return res.status(200).json({ success: true, message: `Deleted '${name}'` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
