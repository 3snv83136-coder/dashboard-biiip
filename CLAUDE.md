# CLAUDE.md — Manuel d'instruction pour Claude Code

> Ce fichier est lu par Claude Code à chaque session. Il définit **ce qu'on construit**, **les règles absolues** et **comment nommer les choses**. En cas de doute, ce document fait autorité avec `app-spec.md` et `data-dictionary.md`.

---

## 1. Le projet en une phrase

**Dashboard Biiip** : une web-app **interne** (back-office) pour piloter la programmation, les artistes, le fichier client, les avis Google et les médias du **Biiip Comedy Club** (cave voûtée de 19 places, Toulon).

Il n'y a **AUCUN accès spectateur**. Les utilisateurs sont : le gérant, l'équipe (staff) et les artistes (accès limité à leur espace).

La billetterie **n'est pas** dans cette app : elle reste sur **Billetweb**. On ne fait qu'afficher un lien.

---

## 2. Règles absolues (à ne jamais enfreindre)

1. **⚠️ TOUJOURS consulter `data-dictionary.md` AVANT de nommer un nouveau champ, une nouvelle collection ou une nouvelle variable de données.** Si le nom existe déjà, réutilise-le à l'identique. Si tu crées un nouveau nom, ajoute-le au `data-dictionary.md` dans la même PR. Aucun champ ne doit exister dans le code sans exister dans le dictionnaire.
2. **snake_case obligatoire** pour tout ce qui touche la donnée : collections MongoDB, champs de documents, clés JSON d'API, colonnes exportées. (Ex. `stage_name`, `show_date`, `review_requests`.) Voir §5.
3. **Ne jamais réintroduire la billetterie, la caisse, la compta ou l'accès spectateur** : c'est explicitement hors périmètre (voir `feature-backlog.md`).
4. **Ne jamais committer de secret** (clés API Brevo, Claude, Meta, URI MongoDB). Tout passe par les variables d'environnement Vercel. Voir `integrations.md`.
5. **Contrôle des accès par rôle** : toute route/action doit vérifier le `role` (`admin`, `staff`, `artist`). Un artiste ne voit **que** ses propres soirées et documents.
6. **Toute erreur non triviale rencontrée pendant le build est consignée** dans `errors-log.md` (cause + solution), pour ne pas la revivre.
7. **Demander avant toute action irréversible** : suppression de données, envoi réel de SMS/emails en masse, publication sur les réseaux, migration destructive.

---

## 3. Stack technique

- **Framework** : Next.js (App Router) — même techno que le site public `biiipcomedyclub.fr`.
- **Base de données** : MongoDB (Atlas recommandé). Accès via le driver officiel + Mongoose (ou équivalent), à confirmer.
- **Auth** : Auth.js (NextAuth v5) avec adapter MongoDB. Rôles `admin` / `staff` / `artist`. (Décision à valider — voir risques dans le résumé projet.)
- **Hébergement** : Vercel.
- **Repo** : `dashboard-biiip` (github.com/3snv83136-coder/dashboard-biiip), vide au démarrage.
- **UI** : responsive (utilisable au téléphone via navigateur, pas d'app native). Base sombre `#1a1a2e` + accents néon (voir `brand-brief.md`).

---

## 4. Périmètre v1 (résumé — détail dans `app-spec.md` et `feature-backlog.md`)

Écrans staff : **Calendrier/Planning** (central), **Artistes**, **Documents**, **Contacts**, **Avis Google**, **Médias**, **Réglages/utilisateurs**.
Écran artiste : **Mon espace** (mes soirées + mes documents).

Fonctions v1 : poser un show au calendrier (statut `pressenti`/`confirme`/`paye`) · générer/envoyer les docs de soirée · espace artiste · fichier client (ajout/recherche/export) · demande d'avis Google (numéro → SMS) · upload photos/vidéos → publication sur le site.

**Reporté en v1.1** : publication automatique sur les réseaux sociaux (Instagram/Facebook/TikTok).

---

## 5. Conventions de nommage

- **Données (MongoDB, JSON, exports)** : `snake_case`. Ex. collection `review_requests`, champ `booking_status`.
- **Collections** : nom au **pluriel**, en `snake_case` (`artists`, `shows`, `media_assets`).
- **Champs booléens** : préfixe `is_` ou `has_` (`is_published`, `has_signed`).
- **Dates** : suffixe `_at` pour un instant (`created_at`, `sent_at`), `_date` pour une date métier (`show_date`).
- **Références** : suffixe `_id` (`artist_id`, `show_id`).
- **Composants React / fichiers** : `PascalCase` pour les composants, `kebab-case` pour les fichiers de route. (Le snake_case ne s'applique **qu'à la donnée**.)
- **Variables d'env** : `SCREAMING_SNAKE_CASE` (`MONGODB_URI`, `BREVO_API_KEY`).

Avant d'inventer un nom de champ : **relis `data-dictionary.md`**. (Oui, encore. C'est la règle n°1.)

---

## 6. Workflow attendu

1. Lire `app-spec.md` (le quoi/pour qui) et `data-dictionary.md` (les noms) avant de coder une fonctionnalité.
2. Construire par écran, en commençant par le **Calendrier** puis les **Artistes** (voir « quoi construire en premier »).
3. Toute nouvelle entité de données → l'ajouter au `data-dictionary.md`.
4. Tenir `errors-log.md` à jour.
5. Ne jamais dépasser le périmètre v1 sans validation explicite du gérant.

---

## 7. Ton & langue

- Interface **en français**.
- Copy de l'app : **efficace, chaleureux, pro** — direct, sans jargon inutile (voir `brand-brief.md`).
