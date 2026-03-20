import { getRegistry } from './_registry.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const registry = getRegistry();
  const total_downloads = registry.reduce((s, p) => s + (p.downloads || 0), 0);
  res.status(200).json({
    registry:         "OPI — Omnikarai Package Index",
    version:          "1.0.0",
    status:           "live",
    total_packages:   registry.length,
    total_downloads,
    description:      "The official package registry for the Omnikarai language",
    endpoints: {
      list:     "GET  /api/packages",
      search:   "GET  /api/packages?q=<query>",
      info:     "GET  /api/packages/<name>",
      publish:  "POST /api/packages",
      stats:    "GET  /api/stats"
    },
    links: {
      homepage: "https://opi.vercel.app",
      docs:     "https://opi.vercel.app/docs.html"
    }
  });
}
