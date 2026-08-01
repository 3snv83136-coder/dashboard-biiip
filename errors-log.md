# errors-log.md — Journal des erreurs (Dashboard Biiip)

> À tenir à jour pendant tout le build. Chaque erreur non triviale rencontrée + sa solution, pour ne jamais la revivre deux fois.

**Format d'une entrée :**

```
### [YYYY-MM-DD] Titre court du problème
- **Contexte** : où / quand (écran, fonctionnalité, commande)
- **Symptôme** : message d'erreur exact / comportement observé
- **Cause** : la vraie cause racine
- **Solution** : ce qui a corrigé
- **Prévention** : comment l'éviter à l'avenir (facultatif)
```

---

## Entrées

### [2026-07-29] create-next-app refuse le nom du dossier
- **Contexte** : `npx create-next-app@14 .` dans `DASHBIIIP`
- **Symptôme** : `Could not create a project called "DASHBIIIP" because of npm naming restrictions`
- **Cause** : npm interdit les majuscules dans le nom de package
- **Solution** : créer dans un sous-dossier `dashboard-tmp` puis déplacer les fichiers ; `name=dashboard-biiip` dans package.json
- **Prévention** : toujours passer un nom lowercase ou créer hors du dossier capitalisé

### [2026-07-29] next-auth@5 introuvable
- **Contexte** : installation Auth.js v5
- **Symptôme** : `No matching version found for next-auth@5`
- **Cause** : la v5 est publiée sous le tag `beta`
- **Solution** : `npm install next-auth@beta`
- **Prévention** : vérifier le tag npm avant d’épingler une major

### [2026-08-01] `/api/llms-txt` figé au build (route statique)
- **Contexte** : ajout de la route `GET /api/llms-txt` (générée depuis `media_assets` en mémoire)
- **Symptôme** : `next build` marquait la route en `○ (Static)` — elle aurait servi un contenu figé au build au lieu de refléter les publications faites en runtime
- **Cause** : la route n'utilise aucune API dynamique (pas de cookies/headers), donc Next l'optimise en statique par défaut
- **Solution** : ajout de `export const dynamic = "force-dynamic"` dans la route
- **Prévention** : pour toute route `GET` publique qui lit le store mutable sans passer par `auth()`, forcer `dynamic = "force-dynamic"` explicitement

---

*(Journal actif.)*
