// api/_registry.js
// DEPRECATED in-memory store — replaced by Neon PostgreSQL / SQLite via src/app/api routes.
// This shim is kept ONLY so old direct /api/ Vercel function routes don't crash.
// All real logic now lives in src/app/api/ (Next.js App Router).
//
// If you see this file being called in production, update your client to use the
// Next.js routes at /api/packages (GET/POST) and /api/packages/[name] (GET/DELETE).

export function getRegistry() {
  console.warn('[OPI] _registry.js shim called — use /api/packages Next.js routes instead')
  return []
}
