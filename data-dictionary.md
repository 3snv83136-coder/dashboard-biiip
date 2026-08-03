# data-dictionary.md — Dictionnaire de données (Dashboard Biiip)

> **Source de vérité pour tous les noms de collections et de champs.**
> Règle absolue (voir `CLAUDE.md`) : **on consulte ce fichier avant de nommer quoi que ce soit**. Tout nouveau champ ajouté au code doit être ajouté ici dans la même PR.
> Convention : **MongoDB**, `snake_case`, collections au pluriel. Types indicatifs (`string`, `number`, `bool`, `date`, `objectId`, `array`, `object`, `enum`).

---

## Collection `users`
Comptes de connexion (staff + artistes). Gérée en lien avec Auth.js.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `full_name` | string | Nom complet |
| `email` | string | Email de connexion (unique) |
| `phone` | string | Téléphone (format E.164) |
| `role` | enum | `admin` \| `staff` \| `artist` |
| `artist_id` | objectId \| null | Réf. `artists._id` si `role = artist` |
| `is_active` | bool | Compte actif |
| `last_login_at` | date | Dernière connexion |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

> Les collections d'auth (`sessions`, `accounts`, `verification_tokens`) sont gérées automatiquement par l'adapter Auth.js — ne pas renommer.

---

## Collection `artists`
Fiches artistes (répertoire + données de booking).

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `stage_name` | string | Nom de scène |
| `legal_name` | string | Nom civil (contrats GUSO) |
| `email` | string | Contact |
| `phone` | string | Téléphone |
| `bio` | string | Bio / présentation |
| `photo_url` | string | Portrait |
| `artist_level` | enum | `jeune_talent` \| `confirme` \| `tete_affiche` |
| `default_fee_amount` | number | Cachet habituel (€) |
| `instagram_handle` | string | @ Instagram |
| `tiktok_handle` | string | @ TikTok |
| `internal_notes` | string | Notes privées staff |
| `access_code` | string | Code d'accès portail fiche artiste |
| `access_code_updated_at` | date \| null | Dernière génération / reset du code |
| `access_last_login_at` | date \| null | Dernière connexion au portail |
| `access_profile_completed_at` | date \| null | 1re soumission complète du formulaire |
| `technical_needs` | string | Besoins techniques (micro, lumières…) |
| `dietary_notes` | string | Allergies / repas |
| `city` | string | Ville de résidence / départ |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `shows`
Le cœur du calendrier de booking (6–12 mois).

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `title` | string | Titre de la soirée (ex. « Plateau Biiip ») |
| `show_date` | date | Date de la soirée |
| `start_time` | string | Heure (ex. `20:30`) |
| `show_type` | enum | `plateau` \| `one_man_show` \| `scene_ouverte` \| `open_mic` |
| `booking_status` | enum | `pressenti` \| `confirme` \| `paye` |
| `capacity` | number | Jauge (défaut `19`) |
| `billetweb_url` | string | Lien billetterie externe |
| `internal_notes` | string | Notes staff |
| `created_by` | objectId | Réf. `users._id` |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `show_bookings`
Lien show ↔ artiste (un plateau accueille plusieurs artistes). Statut et cachet par artiste et par soirée.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `show_id` | objectId | Réf. `shows._id` |
| `artist_id` | objectId | Réf. `artists._id` |
| `slot_order` | number | Ordre de passage |
| `set_duration_min` | number | Durée du set (min) |
| `fee_amount` | number | Cachet pour cette soirée (€) |
| `booking_status` | enum | `pressenti` \| `confirme` \| `paye` |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `documents`
Documents de soirée générés/envoyés aux artistes (conducteur, portrait, contrat GUSO…).

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `show_id` | objectId | Réf. `shows._id` |
| `artist_id` | objectId | Réf. `artists._id` |
| `doc_type` | enum | `conducteur` \| `portrait` \| `contrat_guso` \| `fiche_technique` |
| `file_url` | string | Fichier généré |
| `generated_by` | enum | `claude` \| `manual` |
| `doc_status` | enum | `draft` \| `sent` \| `signed` |
| `sent_at` | date | Date d'envoi |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `contacts`
Fichier client (public sorti de salle, prospects, etc.).

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `full_name` | string | Nom |
| `email` | string | Email |
| `phone` | string | Téléphone (E.164) |
| `source` | enum | `soiree` \| `billetweb` \| `manuel` \| `avis` \| `import` |
| `consent_marketing` | bool | Consentement RGPD newsletter |
| `tags` | array | Étiquettes libres |
| `first_seen_at` | date | Premier contact |
| `last_seen_at` | date | Dernière venue connue |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `review_requests`
Module avis Google : envoi d'un SMS d'invitation à laisser un avis.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `contact_id` | objectId \| null | Réf. `contacts._id` si connu |
| `phone` | string | Numéro destinataire (E.164) |
| `message_body` | string | Texte du SMS (avec lien avis) |
| `send_status` | enum | `pending` \| `sent` \| `failed` |
| `provider` | string | Fournisseur SMS (ex. `brevo`) |
| `provider_message_id` | string | ID retourné par le fournisseur |
| `sent_at` | date | Date d'envoi |
| `created_by` | objectId | Réf. `users._id` |
| `created_at` | date | Création |

---

## Collection `media_assets`
Photos/vidéos d'une soirée, destinées à être publiées sur `biiipcomedyclub.fr` avec métadonnées SEO.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `show_id` | objectId \| null | Réf. `shows._id` |
| `media_type` | enum | `photo` \| `video` |
| `file_url` | string | Fichier source |
| `thumbnail_url` | string | Vignette |
| `alt_text` | string | Texte alternatif (SEO / accessibilité) |
| `caption` | string | Légende |
| `seo_json_ld` | object | Bloc Schema.org (JSON-LD) prêt à injecter |
| `site_slug` | string | Page/URL du site où l'asset apparaît |
| `is_published` | bool | Publié sur le site |
| `published_at` | date | Date de publication |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `site_stories`
Pages éditoriales « The Biiip Review » (L'avis du Biiip) pour le site public.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `title_en` | string | Titre anglais de série (ex. `The Biiip Review`) |
| `title_fr` | string | Titre FR interne (ex. `L'avis du Biiip`) |
| `h1` | string | **H1 unique** de la page (SEO) |
| `slug` | string | Slug URL (`the-biiip-review-…`) |
| `meta_description` | string | Meta description (≤ 160 car.) |
| `body_text` | string | Texte de la page |
| `photo_urls` | array | 1 à 3 URLs photo |
| `video_url` | string | URL vidéo (optionnel) |
| `faqs` | array | FAQ `{ question, answer }` (E-E-A-T / schema FAQPage) |
| `author_name` | string | Auteur éditorial (E-E-A-T) |
| `about_org` | string | Description org. Biiip (E-E-A-T) |
| `seo_json_ld` | object | JSON-LD Article + FAQPage (+ VideoObject) |
| `show_id` | objectId \| null | Réf. `shows._id` si lié à une soirée |
| `is_published` | bool | Publié / prêt pour le site |
| `published_at` | date | Date de publication |
| `public_path` | string | Chemin public dashboard (`/the-biiip-review/{slug}`) |
| `site_target_url` | string | URL cible sur `biiipcomedyclub.fr` |
| `generated_by` | enum | `claude` \| `manual` |
| `created_by` | objectId | Réf. `users._id` |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `uploads`
Fichiers média uploadés (photos/vidéos compressées), **hors** du store principal (non effacés par `saveStore`).

| Champ | Type | Description |
|---|---|---|
| `_id` | string | Identifiant (`upload_…`) |
| `mime_type` | string | Ex. `image/jpeg` |
| `data` | string | Contenu base64 |
| `file_name` | string | Nom d’origine normalisé |
| `created_at` | date | Création |

URL publique : `/api/uploads/{_id}`.

---

## Collection `social_posts` *(v1.1 — publication réseaux sociaux)*
Prépare et publie des posts sur Instagram / Facebook / TikTok.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `platform` | enum | `instagram` \| `facebook` \| `tiktok` |
| `caption` | string | Texte du post |
| `media_asset_ids` | array | Réf. `media_assets._id` |
| `scheduled_at` | date | Publication programmée |
| `post_status` | enum | `draft` \| `scheduled` \| `published` \| `failed` |
| `external_post_id` | string | ID renvoyé par la plateforme |
| `published_at` | date | Date de publication réelle |
| `created_by` | objectId | Réf. `users._id` |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `radio_episodes`
Émissions de la web radio (Radioactive / Biiip).

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `title` | string | Titre de l'émission |
| `episode_date` | date | Date de diffusion |
| `start_time` | string | Heure de début (ex. `19:00`) |
| `end_time` | string | Heure de fin (ex. `20:00`) |
| `episode_status` | enum | `draft` \| `confirme` \| `diffuse` \| `archive` |
| `theme` | string | Thème / angle de l'épisode |
| `synopsis` | string | Pitch court |
| `host_name` | string | Animateur principal |
| `conductor_content` | string | Conducteur de l'émission (déroulé) |
| `playlist_notes` | string | Musiques / jingles / bed |
| `technical_notes` | string | Notes techniques (micro, stream, etc.) |
| `stream_url` | string | Lien de diffusion / replay |
| `internal_notes` | string | Notes staff |
| `created_by` | objectId | Réf. `users._id` |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Collection `radio_guests`
Invités et intervenants liés à une émission radio.

| Champ | Type | Description |
|---|---|---|
| `_id` | objectId | Identifiant |
| `radio_episode_id` | objectId | Réf. `radio_episodes._id` |
| `artist_id` | objectId \| null | Réf. `artists._id` si connu |
| `guest_name` | string | Nom affiché (scène ou civil) |
| `guest_role` | enum | `invite` \| `co_host` \| `chroniqueur` |
| `slot_order` | number | Ordre de passage |
| `segment_title` | string | Titre du segment |
| `segment_duration_min` | number | Durée prévue (min) |
| `talking_points` | string | Points à aborder / questions |
| `created_at` | date | Création |
| `updated_at` | date | Mise à jour |

---

## Énumérations de référence (récap)

- `role` : `admin`, `staff`, `artist`
- `artist_level` : `jeune_talent`, `confirme`, `tete_affiche`
- `show_type` : `plateau`, `one_man_show`, `scene_ouverte`, `open_mic`
- `booking_status` : `pressenti`, `confirme`, `paye`
- `doc_type` : `conducteur`, `portrait`, `contrat_guso`, `fiche_technique`
- `doc_status` : `draft`, `sent`, `signed`
- `contacts.source` : `soiree`, `billetweb`, `manuel`, `avis`, `import`
- `send_status` : `pending`, `sent`, `failed`
- `media_type` : `photo`, `video`
- `platform` : `instagram`, `facebook`, `tiktok`
- `post_status` : `draft`, `scheduled`, `published`, `failed`
- `episode_status` : `draft`, `confirme`, `diffuse`, `archive`
- `guest_role` : `invite`, `co_host`, `chroniqueur`

