# Dashboard Biiip

Back-office interne du **Biiip Comedy Club** (Toulon) — programmation, artistes, documents, fichier client, avis Google et médias.

> Aucun accès spectateur. La billetterie reste sur [Billetweb](https://www.billetweb.fr/).

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind
- Auth.js (NextAuth v5) — rôles `admin` / `staff` / `artist`
- Store mémoire démo (MongoDB Atlas branchable via `MONGODB_URI`)
- Brevo (email + SMS) · Claude (génération de docs)

## Démarrage local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Comptes démo

| Email | Rôle | Mot de passe |
|---|---|---|
| `admin@biiip.local` | admin | `biiip2026` |
| `staff@biiip.local` | staff | `biiip2026` |
| `leo@biiip.local` | artist | `biiip2026` |

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
