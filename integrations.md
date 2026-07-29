# integrations.md — Intégrations & outils externes (Dashboard Biiip)

> Toutes les clés/URI passent par les **variables d'environnement Vercel**. **Aucun secret dans le repo.**

---

## Vue d'ensemble

| Service | Usage | Statut | Priorité |
|---|---|---|---|
| MongoDB (Atlas) | Base de données | À créer | v1 |
| Auth.js (NextAuth) | Authentification + rôles | À intégrer | v1 |
| Vercel | Hébergement + env vars | Compte OK | v1 |
| Brevo | Email **et** SMS | Compte OK | v1 |
| API Claude (Anthropic) | Génération des documents artistes | À brancher | v1 |
| Google (avis) | Lien vers la fiche avis | Simple lien | v1 |
| Billetweb | Billetterie (externe) | Existant | v1 (lien seul) |
| Site `biiipcomedyclub.fr` (Next.js) | Publication des médias | Existant | v1 |
| Meta Graph API (Insta/FB) | Publication réseaux | À faire | **v1.1** |
| TikTok Content Posting API | Publication réseaux | À faire | **v1.1** |

---

## 1. MongoDB
- **Rôle** : base de données de toute l'app.
- **À décider** : réutiliser un cluster existant du portfolio ou en créer un dédié. Recommandé : **cluster/DB dédié** `dashboard_biiip`.
- **Env** : `MONGODB_URI`, `MONGODB_DB=dashboard_biiip`
- Voir `data-dictionary.md` pour les collections.

## 2. Auth.js (NextAuth v5)
- **Rôle** : connexion staff + artistes, gestion des `role`.
- **Adapter** : MongoDB. Méthodes : email/mot de passe **ou** lien magique (envoyé via Brevo).
- **Env** : `AUTH_SECRET`, `AUTH_URL`
- ⚠️ MongoDB ne fournit pas l'auth clé-en-main : c'est cette brique qui la porte. À valider tôt (voir résumé projet).

## 3. Vercel
- **Rôle** : hébergement de la web-app + gestion des variables d'environnement.
- Déploiement connecté au repo `dashboard-biiip`.

## 4. Brevo (email + SMS) — un seul fournisseur pour deux besoins
- **Email** : envoi des documents aux artistes, liens magiques d'auth, éventuelle newsletter.
- **SMS** : module **avis Google** (numéro → SMS avec lien avis). Brevo fait du SMS transactionnel — on consolide ici plutôt que d'ajouter Twilio.
- **Env** : `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SMS_SENDER`
- Écrit dans `review_requests` (`provider = brevo`, `provider_message_id`).
- ⚠️ Le SMS marketing est encadré (RGPD / opt-in). L'avis Google se rattache à une venue réelle → garder une trace du consentement (`contacts.consent_marketing`).

## 5. API Claude (Anthropic)
- **Rôle** : générer les documents « uniques dans le métier » (conducteur, portrait artiste, fiche technique) et, en v1.1, les légendes de posts.
- **Env** : `ANTHROPIC_API_KEY`
- Les documents générés → collection `documents` (`generated_by = claude`).

## 6. Google — avis
- **Rôle** : simple **lien** vers la fiche pour laisser un avis. Pas d'API Google Business.
- Lien de dépôt d'avis : `https://maps.google.com/?q=Biiip+Comedy+Club+Toulon&action=write-review` (ou le lien court `g.page` si disponible).
- Injecté dans le `message_body` des `review_requests`.

## 7. Billetweb (billetterie externe)
- **Rôle** : la billetterie **reste sur Billetweb** — l'app n'y touche pas.
- Compte : `billetweb.fr` (user `228256`). On stocke au plus un `billetweb_url` par show pour affichage.
- Idée v1.1 : importer les acheteurs dans `contacts`.

## 8. Site `biiipcomedyclub.fr` (Next.js) — publication des médias
- **Rôle** : le module **Médias** publie photos/vidéos sur le site public avec SEO.
- **Décision d'architecture à trancher** (voir résumé projet) — deux options :
  - **(a) Base partagée** : le dashboard écrit dans une collection `media_assets` lue par le site public (revalidation ISR / on-demand). Le plus simple si les deux apps partagent le même MongoDB.
  - **(b) API/webhook** : le dashboard appelle une route sécurisée du site pour créer le contenu + déclencher un `revalidatePath`.
- Dans les deux cas, le JSON-LD (`seo_json_ld`) et l'`alt_text` sont produits côté dashboard et injectés dans les pages du site.
- **Env (option b)** : `SITE_PUBLISH_WEBHOOK_URL`, `SITE_REVALIDATE_TOKEN`

---

## Réseaux sociaux — *v1.1* (publication auto)
- **Meta Graph API** (Instagram Business + Page Facebook) : compte Insta pro relié à une page FB, app Meta en revue, tokens longue durée à renouveler.
  - Env : `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`
- **TikTok Content Posting API** : app TikTok for Developers, scope publication.
  - Env : `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- Comptes existants : Instagram `@biiip_comedy_club`, Facebook `/biiipcomedyclub`.

---

## Récap variables d'environnement
```
MONGODB_URI=
MONGODB_DB=dashboard_biiip
AUTH_SECRET=
AUTH_URL=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SMS_SENDER=
ANTHROPIC_API_KEY=
# Publication site (option b)
SITE_PUBLISH_WEBHOOK_URL=
SITE_REVALIDATE_TOKEN=
# Réseaux sociaux (v1.1)
META_APP_ID=
META_APP_SECRET=
META_PAGE_ACCESS_TOKEN=
IG_BUSINESS_ACCOUNT_ID=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```
