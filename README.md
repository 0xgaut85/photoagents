# photo

A minimal, non-scroll landing page. Split layout (2/3 + 1/3) with brand palette:

- Ink: `#0e1210`
- Paper: `#b6b6b6`

## Stack

- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript 5.6
- Tailwind CSS v4
- GSAP 3.13

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run start
```

## Deploy on Railway

1. Push to a Git repo and create a new Railway service from the repo.
2. Railway auto-detects Next.js via Nixpacks. `railway.json` overrides build/start commands.
3. No env vars required for v1. `PORT` is injected automatically.
