// OPI Registry — in-memory store (shared across warm Vercel invocations)
// For production: replace with Vercel KV (vercel.com/docs/storage/vercel-kv)

let _registry = null;

export function getRegistry() {
  if (_registry) return _registry;
  _registry = [
    {
      name: "math_extra",
      version: "1.0.0",
      description: "Extended math: factorial, combinations, statistics, primes",
      author: "Fraziym Tech",
      license: "MIT",
      keywords: ["math", "statistics", "factorial", "primes"],
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
      keywords: ["string", "text", "format", "transform"],
      homepage: "https://opi.vercel.app",
      downloads: 87,
      published_at: "2026-03-05T00:00:00Z",
      files: []
    },
    {
      name: "vectors",
      version: "0.9.0",
      description: "2D/3D vector math: dot, cross, normalize, lerp, length",
      author: "Fraziym Tech",
      license: "MIT",
      keywords: ["vector", "math", "3d", "linear-algebra", "game"],
      homepage: "https://opi.vercel.app",
      downloads: 19,
      published_at: "2026-03-10T00:00:00Z",
      files: []
    },
    {
      name: "collections",
      version: "1.0.0",
      description: "Stack, Queue, LinkedList, HashMap implementations for Omnikarai",
      author: "Fraziym Tech",
      license: "MIT",
      keywords: ["data-structures", "stack", "queue", "hashmap"],
      homepage: "https://opi.vercel.app",
      downloads: 31,
      published_at: "2026-03-12T00:00:00Z",
      files: []
    },
    {
      name: "json_parse",
      version: "0.8.0",
      description: "Lightweight JSON parser and serializer for Omnikarai",
      author: "Fraziym Tech",
      license: "MIT",
      keywords: ["json", "parse", "serialize", "data"],
      homepage: "https://opi.vercel.app",
      downloads: 54,
      published_at: "2026-03-14T00:00:00Z",
      files: []
    }
  ];
  return _registry;
}
