# feature-backlog.md — Backlog (Dashboard Biiip)

> Sépare **ce qu'on construit maintenant** (v1) de **ce qu'on garde pour plus tard**. On ne dérive pas du périmètre v1 sans validation explicite du gérant.

---

## ✅ v1 — Périmètre validé

### Priorité 1 — La colonne vertébrale (à construire en premier)
- [ ] Auth + rôles (`admin`, `staff`, `artist`)
- [ ] **Calendrier / Planning** : créer/éditer un show, statut `pressenti`/`confirme`/`paye`, vue 6–12 mois
- [ ] **Artistes** : répertoire + fiche artiste
- [ ] Lien show ↔ artistes (`show_bookings`) avec cachet et statut par artiste

### Priorité 2 — La valeur différenciante
- [ ] **Documents** : générer via Claude (conducteur, portrait, contrat GUSO, fiche technique) + envoi
- [ ] **Espace artiste** : connexion + accès à ses soirées et documents

### Priorité 3 — Les modules d'acquisition / fidélisation
- [ ] **Contacts / Fichier client** : CRUD, recherche, tags, export CSV, consentement RGPD
- [ ] **Avis Google** : saisie numéro → SMS avec lien avis (via Brevo)
- [ ] **Médias** : upload photo/vidéo → publication sur `biiipcomedyclub.fr` avec `alt_text` + JSON-LD

---

## 🅿️ Parking à idées (v1.1 et au-delà)

### v1.1 — Réseaux sociaux
- [ ] **Publication auto Instagram/Facebook** (Meta Graph API — compte Insta Business + page FB, revue Meta)
- [ ] **Publication auto TikTok** (Content Posting API)
- [ ] Programmation de posts (`social_posts`, `scheduled_at`)
- [ ] Génération des légendes par Claude

### Plus tard (idées à trier)
- [ ] Statistiques : remplissage par soirée, artistes qui performent, avis générés
- [ ] Synchro/import des contacts depuis Billetweb
- [ ] Rappels automatiques aux artistes (J-7, J-1) par email/SMS
- [ ] Signature électronique des contrats GUSO
- [ ] Gestion des cachets / export compta
- [ ] Bon cadeau / suivi des ventes
- [ ] Web radio « Radioactive » — calendrier émissions, conducteurs, invités ✅ *(en cours dans le dashboard)*
- [ ] Application mobile native (seulement si la web-app ne suffit plus)

---

## 🚫 Explicitement hors sujet (ne pas construire)

- Billetterie / réservation en ligne → **reste sur Billetweb**
- Espace / compte **spectateur**
- Caisse, gestion de stock bar
