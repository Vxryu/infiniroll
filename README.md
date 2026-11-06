# InfiniRoll

Roll a number from 0 to 1,000,000, collect 233 badges and climb the leaderboard.

- Comptes avec pseudo + mot de passe (hachés avec scrypt, jamais stockés en clair)
- Les rolls sont tirés **par le serveur** → impossible de tricher sur son score
- Classement Today / This week / All-time / Badges, likes, profil (devise, emojis, couleur)
- Les invités peuvent jouer sans compte (progression gardée sur leur appareil seulement)

## Lancer sur ton PC

Il faut [Node.js](https://nodejs.org) 18 ou plus.

```bash
npm install
npm start
```

Puis ouvre http://localhost:3000. Les données sont gardées dans `data/db.json`.

## Mettre en ligne (GitHub + Render)

1. Crée un repo GitHub et envoie ce dossier dedans (le `.gitignore` exclut déjà `node_modules` et `data`).
2. **Base de données** (obligatoire en ligne, sinon les comptes sont effacés à chaque redémarrage du serveur gratuit) :
   crée une base PostgreSQL gratuite, par exemple sur [Neon](https://neon.tech) ou dans Render (**New → PostgreSQL**), et copie son URL de connexion (`postgresql://...`).
3. Sur [Render](https://render.com) : **New → Web Service** → choisis ton repo.
   - Build command : `npm install`
   - Start command : `npm start`
   - Environment variables :
     - `DATABASE_URL` = l'URL de ta base PostgreSQL
     - `NODE_ENV` = `production`
4. Déploie. La table est créée toute seule au premier lancement.

## Fichiers

| Fichier | Rôle |
|---|---|
| `server.js` | API : comptes, sessions, rolls, classement, likes |
| `store.js` | Stockage (PostgreSQL si `DATABASE_URL`, sinon fichier JSON) |
| `shared/game.js` | Les 233 badges, les probabilités, les raretés (utilisé par le serveur et la page) |
| `public/index.html` | Le jeu |

## Sécurité

- Mots de passe hachés (scrypt + sel unique), comparaison en temps constant
- Session dans un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, valable 30 jours
- Limites anti-spam : connexions (10 essais / 15 min par compte), inscriptions (5 / h par IP), rolls (4 / s)
- Requêtes venant d'un autre site bloquées (protection CSRF)
- Changer son mot de passe déconnecte les autres appareils

Il n'y a pas de récupération de mot de passe par e-mail : si un joueur oublie le sien, il faut recréer un compte.
