# 1r Torneig Base d'Estiu CH Ripollet

Web interactiva per visualitzar i gestionar els resultats del torneig.

## Setup local

```bash
npm install
npm run dev
# Obre http://localhost:3000
```

## Admin panel

Accés a `/admin.html?pwd=YOUR_PASSWORD`

## Deploy a Vercel

```bash
npm install -g vercel
vercel
```

## Estructura

- `public/` - Frontend files (HTML, CSS, JS, assets)
- `api/` - Vercel serverless functions
- `public/data.json` - Tournament data (updated via API)
