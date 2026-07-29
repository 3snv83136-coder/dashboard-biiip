# brand-brief.md — Charte de l'app (Dashboard Biiip)

> Rappel : c'est un **outil interne**. Pas besoin d'un traitement marketing lourd — mais l'app doit respirer l'univers du Biiip Comedy Club, pas ressembler à un tableur froid.

---

## 1. Les 3 mots

**Efficace · Chaleureux · Pro**

- **Efficace** : on pose un show, on envoie un doc, on ajoute un contact en 2 clics. Zéro friction.
- **Chaleureux** : l'ambiance « cave voûtée » de 19 places, l'esprit incubateur. On travaille avec des artistes, pas des lignes de tableur.
- **Pro** : les documents sortis d'ici sont propres, uniques, dignes d'un vrai comedy club.

---

## 2. Univers de marque

Le Biiip, c'est une **cave voûtée intimiste de 19 places** à Toulon — ambiance « petite salle parisienne ». Concept visuel du site : **« Neon Grotto »** (grotte + néons). L'app reprend ce contraste : **fond sombre profond + accents néon lumineux**.

---

## 3. Couleurs

| Rôle | Hex | Usage |
|---|---|---|
| Fond principal (nuit) | `#1a1a2e` | Base de l'app (déjà couleur de thème du site) |
| Fond secondaire / cartes | `#16213e` | Panneaux, cartes, modales |
| Accent néon primaire | `#e94560` | Boutons d'action, statut « confirmé », points forts |
| Accent néon secondaire | `#00d9ff` | Liens, sélection, éléments interactifs |
| Texte principal | `#f5f5f7` | Sur fond sombre |
| Texte atténué | `#9aa0b4` | Labels, métadonnées |
| Succès / payé | `#3ddc97` | Statut `paye`, confirmations |
| Alerte / à traiter | `#ffb703` | Statut `pressenti`, avertissements |

> ⚠️ Les accents néon (`#e94560`, `#00d9ff`) sont proposés d'après le concept « Neon Grotto » du site. **À valider** avec le gérant / le rendu réel du site. `#1a1a2e` est la seule couleur confirmée (theme-color du site).

**Code couleur des statuts de booking** (à réutiliser partout) :
- `pressenti` → jaune `#ffb703`
- `confirme` → rouge néon `#e94560`
- `paye` → vert `#3ddc97`

---

## 4. Typographie

- **Interface** : une sans-serif nette et lisible pour un back-office dense — `Inter` ou `Manrope` (Google Fonts).
- **Titres / accents** : possibilité d'une typo plus marquée pour les en-têtes d'écran, dans l'esprit « affiche de comedy club » — à confirmer avec la typo du site public pour rester cohérent.
- Tailles généreuses, bon contraste (fond sombre), pensé pour un usage rapide y compris sur mobile.

---

## 5. Ton de voix (copy de l'app)

**Direct, chaleureux, jamais corporate.** On tutoie l'équipe. Phrases courtes.

| Contexte | ✅ À faire | ❌ À éviter |
|---|---|---|
| Bouton | « Ajouter un show » | « Soumettre le formulaire de création » |
| Confirmation | « C'est envoyé 🎤 » | « L'opération a été effectuée avec succès » |
| Vide (empty state) | « Aucun show au programme. On remplit la cave ? » | « Aucune donnée disponible » |
| Erreur | « Ça n'est pas passé. On réessaie ? » | « Erreur 500 : Internal Server Error » |

- Emojis : avec parcimonie, sur les moments positifs (🎤 ✅ 🔥). Jamais dans un message d'erreur sérieux.
- Français partout. Pas d'anglicismes gratuits.

---

## 6. Principes UI

- **Sombre par défaut** (l'app vit la nuit, comme le club).
- Le **Calendrier** est l'écran roi : lisible d'un coup d'œil sur 6–12 mois, statuts colorés.
- Densité maîtrisée : c'est un outil de pro, on assume l'information — mais on hiérarchise.
- Responsive : utilisable depuis le téléphone en soirée (ajouter un contact, envoyer un SMS d'avis).
