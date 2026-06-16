# 🚄 Déploiement Avenir Crazy Dance sur Railway (+ MongoDB Atlas)

Ce guide explique **pas à pas** comment mettre en ligne le site + l'API + l'admin
**sur [Railway](https://railway.app)**, en utilisant **[MongoDB Atlas](https://www.mongodb.com/atlas)**
(plan gratuit M0) comme base de données.

> Tout le code est déjà adapté pour Railway (voir la section « Ce qui a déjà été fait »
> en bas du document). Vous n'avez **rien à modifier** dans le code, uniquement à
> suivre les étapes ci‑dessous.

---

## 0. Pré‑requis (5 min)

1. Un compte **GitHub** avec ce projet poussé dans un dépôt.
   ```powershell
   cd "C:\Users\polob\Desktop\avenir dance"
   git init
   git add .
   git commit -m "Initial commit – ready for Railway"
   git branch -M main
   git remote add origin https://github.com/<votre-user>/avenir-crazy-dance.git
   git push -u origin main
   ```
2. Un compte **[MongoDB Atlas](https://www.mongodb.com/atlas)** (gratuit, plan **M0**).
3. Un compte **[Railway](https://railway.app)** (connexion via GitHub recommandée).
4. (Facultatif) La CLI Railway si vous voulez tester en local :
   ```powershell
   npm i -g @railway/cli
   railway login
   ```

---

## 1. Créer la base MongoDB Atlas (gratuit)

1. Connectez‑vous sur [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Build a Database** → choisissez le plan gratuit **M0** (Shared).
3. **Provider / Region** : prenez une région proche de Railway
   (ex. *AWS · Europe (Frankfurt) eu-central-1*) puis **Create**.
4. Onglet **Database Access** → **+ Add New Database User** :
   - **Authentication Method** : Password
   - **Username** : `avenir-app`
   - **Password** : cliquez sur **Autogenerate Secure Password** et **copiez‑le**
     (vous en aurez besoin à l'étape 3).
   - **Built‑in Role** : *Read and write to any database*
   - **Add User**
5. Onglet **Network Access** → **+ Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`) → **Confirm**.
   > Railway n'a pas d'IP fixe sur le plan standard ; cette ouverture est nécessaire.
   > La sécurité repose alors sur le mot de passe (fort) + l'authentification.
6. Retour sur **Database** → bouton **Connect** sur votre cluster →
   **Drivers** → choisissez **Node.js**, version récente.
7. Copiez la chaîne de connexion, du type :
   ```
   mongodb+srv://avenir-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. **Important** : remplacez `<password>` par le mot de passe copié à l'étape 4,
   et ajoutez le **nom de la base** avant le `?`, par exemple :
   ```
   mongodb+srv://avenir-app:MotDePasseGenere@cluster0.xxxxx.mongodb.net/avenircrazydance?retryWrites=true&w=majority
   ```
   Gardez cette URL sous la main pour l'étape 3.

> 💡 Si votre mot de passe contient des caractères spéciaux (`@`, `:`, `/`, `?`, `#`, `%`),
> encodez‑le en URL (`%40`, `%3A`, etc.). Le plus simple : régénérez un mot de passe sans
> caractères spéciaux dans Atlas.

---

## 2. Créer le projet Railway

1. Sur [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Sélectionnez le dépôt `avenir-crazy-dance`.
3. Railway détecte automatiquement Node.js (via Nixpacks) et lance un premier build.
   Il va **échouer** car il manque les variables d'environnement → c'est normal,
   on les ajoute juste après.

> ❌ **N'ajoutez pas** de service MongoDB dans Railway : on utilise Atlas.

---

## 3. Configurer les variables d'environnement de l'API

Sur le service de votre app (`avenir-crazy-dance`) → onglet **Variables** →
**Raw Editor** (icône `</>`), puis collez (en remplaçant la valeur de `MONGODB_URI`
par l'URL Atlas obtenue à l'étape 1) :

```env
MONGODB_URI=mongodb+srv://avenir-app:MotDePasseGenere@cluster0.xxxxx.mongodb.net/avenircrazydance?retryWrites=true&w=majority
JWT_SECRET=remplacez-par-une-longue-chaine-aleatoire-de-64-caracteres
ADMIN_EMAIL=admin@avenircrazydance.be
ADMIN_PASSWORD=ChangezMoiVite!
UPLOAD_DIR=/data/uploads
PUBLIC_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Formulaire de contact (optionnel — laissez vide pour désactiver l'envoi d'e-mails)
CONTACT_EMAIL=direction@avenircrazydance.be
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Site Avenir Crazy Dance <no-reply@avenircrazydance.be>
```

Points importants :

- **`MONGODB_URI`** : c'est l'URL Atlas (`mongodb+srv://…`) construite à l'étape 1.
  Vérifiez qu'elle contient bien `/avenircrazydance` (ou un autre nom) avant le `?`,
  sinon Mongoose se connectera à la base par défaut `test`.
- **`JWT_SECRET`** : générez‑en un avec PowerShell :
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
  ```
- **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** : compte créé automatiquement au 1er démarrage.
  Connectez‑vous, puis changez le mot de passe et videz cette variable.
- **`UPLOAD_DIR=/data/uploads`** : indispensable, c'est le point de montage du Volume
  qu'on va créer à l'étape 4.
- **`PORT=4000`** : à ajouter **uniquement si Railway vous demande un port** lors
  de la génération du domaine (voir étape 5). Sinon Railway l'injecte tout seul
  et vous pouvez l'omettre.

> ⚠️ Pour le SMTP, vous pouvez utiliser SendGrid, Brevo, Mailjet, OVH, Gmail (mot de
> passe d'application)… ou laisser vide ; dans ce cas le formulaire de contact ne fera
> qu'enregistrer côté serveur.

---

## 4. Ajouter un Volume persistant pour les uploads d'images

Le système de fichiers de Railway est **éphémère** : sans Volume, les images uploadées
disparaissent à chaque redéploiement.

1. Sur le service de l'app → onglet **Settings** → section **Volumes** → **+ New Volume**.
2. **Mount path** : `/data`
3. **Size** : `1 GB` suffit pour démarrer (extensible plus tard).
4. Validez. Railway redéploie automatiquement.

Le code utilisera `UPLOAD_DIR=/data/uploads` (le dossier est créé automatiquement).

---

## 5. Exposer le service sur Internet

1. Service de l'app → onglet **Settings** → **Networking** → **Generate Domain**.
2. **Si Railway vous demande un port** (« Enter the port your app listens on »
   ou *Target port*) : entrez **`4000`**.
   - Dans ce cas, allez aussi dans **Variables** et ajoutez `PORT=4000` pour que
     le serveur écoute bien sur ce port (les deux valeurs doivent correspondre).
   - Redéployez si Railway ne le fait pas automatiquement.
3. Railway vous attribue une URL `https://<nom>.up.railway.app`.
4. (Optionnel) **Custom Domain** : cliquez **+ Custom Domain**, entrez
   `www.avenircrazydance.be`, puis ajoutez l'enregistrement **CNAME** chez votre
   registrar comme indiqué par Railway.

---

## 6. Vérifier le déploiement

Une fois le build terminé (onglet **Deployments**, ~1‑2 min), testez ces URLs :

| URL | Doit afficher |
|-----|---------------|
| `https://<votre-domaine>/` | Le site vitrine Avenir Crazy Dance |
| `https://<votre-domaine>/admin` | L'écran de connexion admin |
| `https://<votre-domaine>/api/health` | `{"ok":true}` |
| `https://<votre-domaine>/api/courses` | `[]` (liste vide au début) |

Connectez‑vous à `/admin` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 7. (Optionnel) Injecter les données de démonstration

Pour pré‑remplir la base avec les cours, profs, articles et évènements de la maquette :

### Option A — Via la CLI Railway (recommandé)

```powershell
railway login
railway link            # sélectionnez le projet
railway run npm run seed
```

La commande s'exécute **en local** mais utilise les variables d'environnement de
Railway (donc la bonne MongoDB).

### Option B — Une seule fois au prochain démarrage

Sur le service → **Settings** → **Deploy** → **Custom Start Command** :
remplacez temporairement `npm start` par `npm run seed && npm start`,
redéployez, puis remettez `npm start` immédiatement après pour ne pas
ré‑importer à chaque restart.

---

## 8. Mises à jour suivantes

Chaque `git push` sur la branche **main** déclenche un nouveau déploiement.
Aucune action manuelle requise.

```powershell
git add .
git commit -m "feat: …"
git push
```

---

## 9. Checklist de production

- [ ] `JWT_SECRET` fort (≥ 48 caractères aléatoires)
- [ ] `ADMIN_PASSWORD` changé via l'interface puis variable retirée
- [ ] Volume monté sur `/data` (taille suffisante)
- [ ] Domaine personnalisé configuré + HTTPS actif (auto par Railway)
- [ ] SMTP configuré pour les e-mails du formulaire de contact
- [ ] Sauvegardes MongoDB Atlas : sur le plan **M0** gratuit elles ne sont pas
      automatiques → exportez régulièrement avec `mongodump` ou passez à un cluster
      payant (snapshots inclus). Atlas → **Backup** pour activer.
- [ ] Healthcheck `/api/health` qui répond `200`

---

## 10. Dépannage rapide

| Symptôme | Cause probable | Solution |
|---------|----------------|----------|
| `MongoServerError: bad auth` | `MONGODB_URI` incorrecte ou mot de passe mal encodé | Régénérez un mot de passe Atlas sans caractères spéciaux, recopiez l'URL complète |
| `MongooseServerSelectionError: … ETIMEDOUT` | IP non autorisée côté Atlas | **Network Access** Atlas → autoriser `0.0.0.0/0` |
| Les images disparaissent après un redeploy | Pas de Volume | Étape 4 + vérifier `UPLOAD_DIR=/data/uploads` |
| 502 / app crash au démarrage | `PORT` codé en dur ou variable manquante | Retirez `PORT` des variables, regardez les logs |
| `/api/*` répond mais le site renvoie 404 | `index.html` ignoré par Git | Vérifiez avec `git ls-files index.html` |
| Connexion admin refusée | `ADMIN_EMAIL`/`PASSWORD` non définis au 1er boot | Ajoutez‑les puis redéployez |
| Logs : `Error: listen EADDRINUSE` | Vous avez forcé `PORT` à une mauvaise valeur | Mettez `PORT=4000` et indiquez `4000` lors du Generate Domain |
| Railway demande un port lors du Generate Domain | Pas d'auto‑détection | Entrez `4000` + ajoutez la variable `PORT=4000` |

Logs en direct :
```powershell
railway logs
```

---

## ✅ Ce qui a déjà été fait dans le code (vous n'avez rien à toucher)

- `package.json` : ajout de `engines.node >= 18`
- `server/server.js` :
  - `trust proxy = 1` (pour Railway)
  - sert le site vitrine (`index.html` + `adc-frontend.js`) à la racine `/`
  - garde `/admin`, `/site`, `/api/*`, `/uploads/*`
  - `app.listen(PORT)` lit `process.env.PORT` injecté par Railway
- `server/middleware/upload.js` : `UPLOAD_DIR` configurable via variable d'environnement
  (pointe vers le Volume Railway)
- `adc-frontend.js` + `index.html` : appellent l'API **sur la même origine** par défaut
  (plus de `http://localhost:4000` codé en dur en production)
- `railway.json` : configuration build/start + healthcheck `/api/health`
- `.gitignore` corrigé pour committer `index.html` et `.env.example`
- `.dockerignore` ajouté
- `.env.example` enrichi avec `UPLOAD_DIR`

Bon déploiement ! 🎉

