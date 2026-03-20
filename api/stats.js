// GET /api/stats — registry statistics
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    registry:    "OPI — Omnikarai Package Index",
    version:     "1.0.0",
    status:      "live",
    description: "The official package registry for the Omnikarai language",
    endpoints: {
      list:     "GET  /api/packages",
      search:   "GET  /api/packages?q=<query>",
      info:     "GET  /api/packages/:name",
      download: "GET  /api/packages/:name/download",
      publish:  "POST /api/packages",
      stats:    "GET  /api/stats"
    },
    links: {
      homepage:   "https://opi.vercel.app",
      compiler:   "https://github.com/fraziym/omnikarai",
      docs:       "https://opi.vercel.app/docs"
    }
  });
}
