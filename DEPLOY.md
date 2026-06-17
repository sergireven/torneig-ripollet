# 🚀 Guia de Desplegament - Torneig Base d'Estiu CH Ripollet

## Arquitectura

```
GitHub Repo ──► Vercel (hosting gratuït)
                   │
                   ├─ /public       ← Frontend (HTML/CSS/JS)
                   └─ /api          ← Serverless functions
```

## Pas 1 — Setup local

### Prerequisites
- Node.js 18+ (optional, només si vols testear local)
- GitHub account
- Vercel account (gratuït)

### Clonar i testear

```bash
git clone https://github.com/sergireventos/torneig-ripollet.git
cd torneig-ripollet

# Testear en local (opcional)
npx serve public -p 3000
# Obre http://localhost:3000
```

## Pas 2 — Setup GitHub

1. Ve a https://github.com/new
2. Crea un repositori nou:
   - **Nom:** `torneig-ripollet`
   - **Visibilitat:** Public
   - No inicialitzis README, .gitignore, ni license
3. Segueix les instruccions per pujar el projecte local:

```bash
git init
git add .
git commit -m "Initial commit: Torneig Base d'Estiu web"
git branch -M main
git remote add origin https://github.com/sergireventos/torneig-ripollet.git
git push -u origin main
```

## Pas 3 — Setup Vercel

1. Ve a https://vercel.com
2. Inicia sessió o registra't amb GitHub
3. Clica **"New Project"**
4. Importa el repositori `torneig-ripollet`
5. **Build settings** (deixa per defecte):
   - Framework: None (static)
   - Build command: (buit)
   - Output directory: public
6. Clica **Deploy**

En 30 segons tindrà la web a una URL com: `https://torneig-ripollet.vercel.app`

## Pas 4 — Variables d'entorn (opcional)

Si vols canviar la contrasenya d'admin:

1. A Vercel → Settings → Environment Variables
2. Afegeix: `ADMIN_PASSWORD` = `tu_contraseña_segura`
3. Redeploy el projecte

Default: `cambiar123`

## Actualitzar resultats

### Opció A: Via web admin panel
1. Obre `/admin.html?pwd=cambiar123`
2. Selecciona partit i actualitza resultat
3. Els canvis es guarden en `public/data.json`

### Opció B: Editar manualment i pujar
1. Edita `public/data.json` localment
2. Commit i push:
   ```bash
   git add public/data.json
   git commit -m "Update match results"
   git push
   ```
3. Vercel redeplega automàticament

## Estructura del projecte

```
torneig-ripollet/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CI/CD per a Vercel
├── api/
│   ├── auth.js                 ← Password validation
│   └── matches.js              ← Match update API
├── public/
│   ├── index.html              ← Home page
│   ├── admin.html              ← Admin panel
│   ├── data.json               ← Tournament data
│   ├── css/
│   │   ├── style.css           ← Main styles
│   │   └── admin.css           ← Admin styles
│   ├── js/
│   │   ├── app.js              ← Home logic
│   │   └── admin.js            ← Admin logic
│   └── assets/
│       └── escudos/            ← Club shields (SVG)
├── package.json
├── vercel.json                 ← Vercel config
├── .env.example                ← Template for env vars
├── .env.local                  ← Local dev env (ignored by git)
├── .gitignore
├── README.md
└── DEPLOY.md                   ← This file
```

## Troubleshooting

**Q: Admin panel no funciona**
A: Assegura't que la contrasenya és `cambiar123` (default)

**Q: Els resultats no es guarden**
A: A Vercel, els arxius no es guarden a `/tmp`. Considera usar un KV store:
   - Vercel KV (recomana't per aquesta use case)
   - Supabase (per a dades més complexes)

**Q: Vull actualitzacions en temps real**
A: Afegeix un endpoint que actualitzi directament `data.json` i fes commit automàtic a GitHub via API

**Q: Deploy fallit**
A: Verifica:
   - GitHub token i secrets configurat a Vercel
   - `.gitignore` no ignora arxius importants
   - `vercel.json` correcte

## Cost

**Totalitat: 0€ (freemium)**

- GitHub: Gratuït per repos públics
- Vercel: Gratuït fins a 100GB/mes
- Domini personalitzat (.cat): ~15€/any (opcional)

## Next Steps

1. ✅ Setup GitHub + Vercel
2. ✅ Deploy web
3. ✅ Testear admin panel
4. 📝 Actualitzar `ADMIN_PASSWORD` a contrasenya segura
5. 📝 (Optional) Configurar domini personalitzat
6. 📝 (Optional) Setup KV store per a persistència millor

## Preguntes?

Contacte: sergi@example.com
