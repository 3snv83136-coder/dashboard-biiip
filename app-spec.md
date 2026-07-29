# app-spec.md — Spécification (Dashboard Biiip)

## 1. En une phrase

Une web-app **interne** qui centralise la programmation, les artistes, le fichier client, les avis Google et les médias du **Biiip Comedy Club** — pour remplacer le « flou artistique » actuel par une vraie vision à 6–12 mois.

## 2. Le problème résolu

Aujourd'hui : **aucune donnée centralisée**, **aucun fichier client**, et une **programmation floue**. Impossible de booker sereinement à l'avance ni de communiquer proprement avec les artistes.

L'app apporte : une **base unique**, un **calendrier de booking** clair, et la **génération de documents artistes de qualité et uniques dans le métier** — ce qui devient un vrai avantage concurrentiel.

## 3. Pour qui (utilisateurs)

| Profil | Rôle (`role`) | Ce qu'il fait |
|---|---|---|
| Gérant | `admin` | Tout : programmation, artistes, contacts, réglages, gestion des accès |
| Équipe | `staff` | Programmation, artistes, contacts, médias, avis Google |
| Artiste | `artist` | Accès limité à **son** espace : ses soirées + ses documents |

> **Pas d'accès spectateur.** Le public ne se connecte jamais à l'app.

## 4. Ce qu'on construit (fonctionnalités v1)

1. **Calendrier / Planning** — poser un show (date, type, artistes), suivre le statut `pressenti` → `confirme` → `paye` sur 6–12 mois. *Écran central.*
2. **Artistes** — répertoire + fiche (contact, bio, cachet, niveau, docs liés).
3. **Documents** — générer (via Claude) et envoyer les documents de soirée : conducteur, portrait, contrat GUSO, fiche technique.
4. **Espace artiste** — l'artiste se connecte et récupère les documents de ses soirées.
5. **Contacts / Fichier client** — ajouter, chercher, taguer, exporter (CSV), gérer le consentement RGPD.
6. **Avis Google** — saisir un numéro → envoyer un SMS invitant à laisser un avis (lien fiche Google).
7. **Médias** — uploader photos/vidéos d'une soirée → publier sur `biiipcomedyclub.fr` avec `alt_text` et JSON-LD (SEO).

## 5. Reporté (v1.1 et au-delà)

- **Publication automatique réseaux sociaux** (Instagram/Facebook/TikTok via API) — souhaité en option A, mais lourd (revue Meta, tokens, TikTok Content Posting API). Voir `feature-backlog.md`.

## 6. Explicitement hors périmètre

- Billetterie / réservation (**reste sur Billetweb**).
- Accès spectateur / espace public.
- Statistiques & reporting avancés (taux de remplissage, CA).
- Application mobile native (on fait une **web-app responsive**).
- Gestion des stocks bar / caisse / compta des cachets.

## 7. Écrans (arborescence)

**Espace staff**
- `Calendrier / Planning` (écran d'accueil)
- `Artistes` → liste + fiche artiste
- `Documents`
- `Contacts`
- `Avis Google`
- `Médias`
- `Social` *(v1.1)*
- `Réglages / Utilisateurs`

**Espace artiste**
- `Mon espace` → mes soirées à venir + mes documents à télécharger

## 8. Règles métier clés

- Un **show** (`plateau`) peut réunir **plusieurs artistes** (via `show_bookings`), chacun avec son cachet et son statut.
- Jauge par défaut : **19** places (`capacity`).
- Un artiste ne voit **que** ses propres soirées et documents (contrôle par `role` + `artist_id`).
- Toute donnée manipulée doit correspondre à une collection/champ du `data-dictionary.md`.

## 9. Stack (voir `CLAUDE.md` et `integrations.md`)

Next.js (App Router) · MongoDB · Auth.js · Vercel · Brevo (email + SMS) · API Claude (génération de documents).
