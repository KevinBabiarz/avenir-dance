# Frontend statique — Avenir Crazy Dance (à héberger sur OVH)

Ce dossier contient le **site vitrine statique** à uploader sur votre hébergement
mutualisé OVH (ou tout autre hébergeur de fichiers statiques).

## 📦 Contenu

```
frontend/
├── index.html         # Page d'accueil du site vitrine
└── adc-frontend.js    # Hydratation depuis l'API (cours, profs, événements...)
```

## 🔌 Connexion à l'API

Dans `index.html`, juste avant `<script src="./adc-frontend.js">`, la ligne :

```html
<script>window.ADC_API = 'https://avenir-dance-production.up.railway.app';</script>
```

…indique au frontend où trouver l'API Railway.

➡️ **Si vous configurez un domaine personnalisé pour l'API** (ex.
`api.avenircrazydance.be` via Railway → Custom Domain), remplacez cette URL.

## 🚀 Déploiement sur OVH

### Option A — FTP (le plus simple)

1. Ouvrez **FileZilla** (ou WinSCP) avec vos identifiants FTP OVH
   (visibles dans l'espace client OVH → Hébergement → FTP-SSH).
2. Connectez‑vous au serveur FTP OVH (`ftp.cluster0XX.hosting.ovh.net`).
3. Allez dans le dossier `www/` (racine publique).
4. **Uploadez le contenu** de ce dossier `frontend/` :
   - `index.html` → `www/index.html`
   - `adc-frontend.js` → `www/adc-frontend.js`
5. Patientez quelques secondes, puis testez :
   `https://www.avenircrazydance.be/`

### Option B — Git (si activé sur votre hébergement OVH)

```powershell
cd frontend
git init
git remote add ovh ssh://votre-user@gitssh.cluster0XX.hosting.ovh.net/~/www
git add .
git commit -m "deploy frontend"
git push ovh main
```

## 🔄 Mettre à jour le frontend

Après chaque modification de `index.html` ou `adc-frontend.js` :

1. Sauvegardez les changements.
2. Re-uploadez les fichiers modifiés via FTP (FileZilla → glisser/déposer écrase l'existant).
3. Videz le cache de votre navigateur (Ctrl+F5).

## ⚠️ Important

- **Ne jamais** uploader le dossier `server/` ou `node_modules/` sur OVH.
- Le formulaire de contact appelle `POST /api/contact` sur l'API Railway →
  vérifiez que `SMTP_*` est configuré dans Railway pour que les e-mails partent.
- Les images uploadées via l'admin restent servies par Railway
  (`https://avenir-dance-production.up.railway.app/uploads/…`).

## 🧪 Tester en local avant de déployer

```powershell
cd frontend
# Avec n'importe quel serveur statique :
npx serve .
# puis ouvrir http://localhost:3000
```

