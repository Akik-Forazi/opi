# OPI — Omnikarai Package Index

The official package registry for the [Omnikarai](https://github.com/fraziym/omnikarai) language.

**Live at:** https://opi.vercel.app

---

## Deploy to Vercel

```bash
cd opi
npm i -g vercel
vercel --prod
```

That's it. The site deploys in ~10 seconds.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List all packages |
| GET | `/api/packages?q=math` | Search packages |
| GET | `/api/packages/:name` | Get package info |
| POST | `/api/packages` | Publish a package |
| GET | `/api/stats` | Registry stats |

## omnip CLI

Build the client:
```bash
gcc -O2 -o omnip.exe omnip/src/omnip.c -lkernel32 -lwinhttp
```

Use it:
```bash
omnip install math_extra     # install from OPI
omnip install .              # install local package
omnip publish .              # publish to OPI
omnip search vector          # search registry
omnip list                   # list installed
```

## Package Format

Every package needs `omnikarai.toml`:

```toml
[metadata]
name        = "my_package"
version     = "1.0.0"
description = "Does something useful"
author      = "Your Name"
license     = "MIT"
```

---

*Fraziym Tech & AI · 2026*
