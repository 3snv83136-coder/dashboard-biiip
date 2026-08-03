# Dashboard Biiip

Back-office interne du **Biiip Comedy Club** (Toulon) — programmation, artistes, documents, fichier client, avis Google et médias.

> Aucun accès spectateur. La billetterie reste sur [Billetweb](https://www.billetweb.fr/).

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind
- Auth.js (NextAuth v5) — rôles `admin` / `staff` / `artist`
- Store MongoDB Atlas (`MONGODB_URI`) — fallback mémoire si URI absente
- Brevo (email + SMS) · Claude (génération de docs)

## Installer sur l’ordinateur (comme une app)

L’app est une **PWA** : pas besoin de l’App Store.

1. Ouvre [https://dashboard-biiip.vercel.app](https://dashboard-biiip.vercel.app) dans **Chrome** ou **Edge**
2. Clique l’icône **⊕ Installer** dans la barre d’adresse, ou menu **⋮ → Installer Dashboard Biiip…**
3. Sur **Safari Mac** : **Fichier → Ajouter au Dock**

Tu peux aussi utiliser le bouton **Installer sur cet ordinateur** (écran de connexion ou Réglages).

## Démarrage local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Accès

Mot de passe unique : `1076` (pas d’email).

## Écrans v1

- **Calendrier** — shows, statuts `pressenti` / `confirme` / `paye`
- **Artistes** — répertoire + fiche
- **Documents** — génération (Claude ou template) + envoi
- **Contacts** — CRUD, recherche, export CSV, RGPD
- **Avis Google** — SMS via Brevo (simulé sans clé)
- **Médias** — upload URL + publication site
- **Réglages** — utilisateurs (admin)
- **Mon espace** — vue artiste

## Déploiement Vercel

1. Importer le repo `dashboard-biiip`
2. Ajouter les variables d’environnement (voir `integrations.md` / `.env.example`)
3. Deploy

## Docs projet

- `CLAUDE.md` — règles absolues
- `app-spec.md` — spécification
- `data-dictionary.md` — noms de champs (snake_case)
- `brand-brief.md` — Neon Grotto
- `feature-backlog.md` — périmètre v1
- `integrations.md` — services externes
