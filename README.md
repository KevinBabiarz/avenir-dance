# Avenir Crazy Dance — Interface d'administration & API

Back-end **Node.js / Express / MongoDB (Mongoose)** avec une interface d'administration web
permettant de gérer le contenu du site du studio de danse :

- 🕺 **Cours** (par style, horaires, niveaux)
- 👩‍🏫 **Professeurs** (portraits, spécialités, réseaux sociaux)
- 📝 **Blog** (articles & actualités)
- 📅 **Évènements** (galas, stages, battles…)
- 🖼️ **Galerie** (mosaïque de photos)

Chaque catégorie supporte l'**upload d'images** (stockées sur le serveur dans `server/uploads/`).

---

## 1. Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- Une base **MongoDB** : instance locale (`mongod`) ou un cluster gratuit [MongoDB Atlas](https://www.mongodb.com/atlas).

## 2. Installation

```powershell
npm install
copy .env.example .env   # puis éditez .env (MONGODB_URI, JWT_SECRET, identifiants admin)
```

## 3. Lancer le serveur

```powershell
npm run dev      # mode développement (rechargement auto)
# ou
npm start
```

- Interface admin : <http://localhost:4000/admin>
- API : <http://localhost:4000/api>

Au premier démarrage, un compte administrateur est créé automatiquement à partir de
`ADMIN_EMAIL` / `ADMIN_PASSWORD` du fichier `.env`.

## 4. (Optionnel) Insérer les données de démonstration

Reprend les cours, professeurs, articles et évènements de la maquette d'origine :

```powershell
npm run seed
```

---

## 5. Structure du projet

```
server/
  server.js              # point d'entrée Express
  seed.js                # données de démonstration
  config/db.js           # connexion MongoDB
  models/                # schémas Mongoose
    Course.js  Teacher.js  Post.js  Event.js  GalleryItem.js  User.js
  middleware/
    auth.js              # JWT (protection des écritures)
    upload.js            # Multer (upload d'images)
  routes/
    auth.js  upload.js  crud.js
    courses.js  teachers.js  posts.js  events.js  gallery.js
  public/admin/          # interface d'administration (HTML/CSS/JS)
  uploads/               # images téléversées (servies sur /uploads)
```

---

## 6. API REST

Authentification par **JWT**. La lecture (`GET`) est publique ; la création, modification,
suppression et l'upload nécessitent l'en-tête `Authorization: Bearer <token>`.

### Authentification
| Méthode | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET  | `/api/auth/me` | Vérifie le jeton courant |

### Ressources (même schéma CRUD pour chaque catégorie)
`courses` · `teachers` · `posts` · `events` · `gallery`

| Méthode | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/<ressource>` | – | Liste les éléments publiés (`?all=1` pour tout inclure) |
| GET | `/api/<ressource>/:id` | – | Détail d'un élément |
| POST | `/api/<ressource>` | ✅ | Crée un élément |
| PUT | `/api/<ressource>/:id` | ✅ | Met à jour un élément |
| DELETE | `/api/<ressource>/:id` | ✅ | Supprime un élément |

### Upload d'images
| Méthode | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/upload` | ✅ | Champ form-data `image` → `{ url, filename }` |
| POST | `/api/upload/multiple` | ✅ | Champ form-data `images` (jusqu'à 20) |
| DELETE | `/api/upload/:filename` | ✅ | Supprime un fichier image |

Formats acceptés : PNG, JPEG, WebP, AVIF, GIF — 8 Mo max.

---

## 7. Schémas de données

**Course** : `title, category(enum), tag, schedule, level, description, image, order, published`
**Teacher** : `name, role, bio, image, instagram, facebook, order, published`
**Post** : `title, category, excerpt, content, image, date, order, published`
**Event** : `title, tag, date, time, place, description, image, order, published` (+ virtuals `day`, `month`)
**GalleryItem** : `label, category, image, size(small|wide|large), order, published`

---

## 8. Site vitrine branché sur l'API

La page `Avenir Crazy Dance.dc.html` est **déjà connectée à l'API**. Au chargement, elle
affiche d'abord des données par défaut puis les remplace par le contenu de MongoDB pour les
**cours, professeurs, évènements, blog et galerie** (images uploadées comprises).

Deux façons de l'ouvrir :

- **Recommandé (même origine)** : avec le serveur lancé, ouvrez <http://localhost:4000/site>.
- **Fichier local** : ouvrez directement le `.html`. Les appels visent `http://localhost:4000`
  (CORS est activé sur le serveur). Certains navigateurs restreignent `file://` → `http://` ;
  préférez alors l'URL `/site`.

Pour pointer vers un autre serveur (production, autre port), définissez l'URL **avant** le
script de la page :

```html
<script>window.ADC_API = 'https://api.mondomaine.com';</script>
```

> Le mapping est automatique : `category → cat`, dates formatées en français, `image` utilisé
> comme visuel des cartes, liens Instagram/Facebook des professeurs, tailles de tuiles de la
> galerie (`small` / `wide` / `large`).

