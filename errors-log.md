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

### [2026-08-03] FUNCTION_INVOCATION_TIMEOUT sur génération Médias (IA)
- **Contexte** : Médias → « Générer le texte seulement » / « Créer l’aperçu (IA + page) » en prod Vercel Hobby
- **Symptôme** : `An error occurred with your deployment FUNCTION_INVOCATION_TIMEOUT cdg1::…`
- **Cause** : `callClaude` enchaînait plusieurs modèles (~6–8s chacun) → dépassait la limite ~10s des fonctions serverless
- **Solution** : un seul modèle haiku (`fast: true`, timeout 4,5s) + `Promise.race` 5,5s avec brouillon local + fallback client si la réponse Vercel est déjà un timeout
- **Prévention** : ne jamais enchaîner plusieurs appels Claude séquentiels dans une route Hobby ; toujours renvoyer un brouillon avant 10s

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

---

*(Journal actif.)*
