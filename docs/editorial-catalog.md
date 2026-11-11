# Editorial catalog — collections & pilot book

**Date:** 2026-11-11 · Status: pilot content spec — text itself written in Phase 3 seed.

## 1. Collections (EditorialCollections)

| Slug | Title FR | Editorial line | MVP state |
|---|---|---|---|
| `contes-legendes` | Contes & Légendes | Histoires orales, pourquoi du monde, tricksters, morale du partage | Pilot lives here |
| `royaumes-civilisations` | Royaumes & Civilisations | Empires, cités, savoirs — pour les 8–12 ans en priorité | « Bientôt » |
| `famille-transmission` | Famille & Transmission | Grands-parents, langue, rituels, mémoire familiale | « Bientôt » |
| `afrofuturisme` | Afrofuturisme & Imagination | Innovation, science-fiction africaine, espoir | « Bientôt » |

Each collection carries `description_fr` + `cultural_scope` note displayed on catalog.

## 2. Pilot book — « Le Baobab aux Mille Secrets »

- **Slug:** `le-baobab-aux-mille-secrets` · **Collection:** contes-legendes
- **Logline:** Un enfant traverse la savane à la recherche de l'arbre qui garde les secrets
  du vent — et découvre que le plus grand secret était de savoir écouter.
- **Moral core:** l'écoute et la transmission (modular — accent moral chip can tilt toward
  « courage » or « générosité » within schema bounds).
- **Cultural context** (`cultural_contexts` row):
  - `region`: Afrique de l'Ouest (savanes du Sahel)
  - `tradition_type`: `inspiration` — le baobab et les contes oraux sahéliens inspirent
    l'histoire ; elle est une fiction originale, pas un conte traditionnel attesté.
  - `summary_fr`: « Le baobab, arbre millénaire de la savane, est au cœur de nombreux récits
    oraux ouest-africains. Ce livre s'en inspire sans reproduire un conte précis. »
  - `verified_by`: null until human editorial review — **never auto-verified** (directive §12).

## 3. Page plan (12 pages — BookTemplateVersions.page_plan)

| # | kind | Beat | Illustration focus |
|---|---|---|---|
| 1 | cover | Titre + vignette baobab au crépuscule | Baobab silhouette, soleil bas |
| 2 | story | Le village s'endort ; la vieille Nabè dit : « Le baobab sait. » | Village au crépuscule, silhouettes |
| 3 | story | Héros (prénom perso) décide d'y aller | Enfant regardant l'horizon |
| 4 | story | La traversée : herbes hautes, oiseaux | Savane, mouvement |
| 5 | story | Rencontre du premier compagnon (optionnel) | Compagnon (ex. écureuil, oiseau) |
| 6 | story | « Les mille secrets » — l'enfant veut tout savoir | Enfant face au tronc |
| 7 | story | Le vent parle : secret 1 — l'écoute | Feuilles en mouvement |
| 8 | story | Secret 2 — la racine qui relie | Racines, sous-bois |
| 9 | story | Secret 3 — la communauté sous l'arbre | silhouette du tronc large |
| 10 | story | Retour au village ; l'enfant raconte | Enfant racontant au village |
| 11 | story | « Le plus grand secret : écouter pour transmettre » | Groupe sous baobab, feu |
| 12 | back | « Fin — et le vent continue de souffler » + place pour dédicace | Petit baobab, nuit étoilée |

## 4. Personalization schema (pilot)

| Field | Type | Constraints |
|---|---|---|
| `hero_name` | string | 1–30 chars, letters + `-'` |
| `age_band` | enum | `3-5` \| `6-8` \| `9-12` → selects `tone_profile` |
| `skin_tone` | enum | 6 swatches (matrice de tons, descriptive labels FR) |
| `hair` | string | ≤60 chars, free (« tresses », « afro bouclé »…) |
| `outfit` | enum | 4 options (ex. « pagne wax », « chemise », « salopette ») |
| `companion` | bool | adds/removes page-5 beat + companion character row |
| `moral_emphasis` | enum | `ecoute` \| `partage` \| `courage` — reweights page-11 text |

`tone_profile`: 3-5 → phrases ≤6 mots, rythme lent ; 6-8 → standard ; 9-12 → vocabulaire
élargi (+ un « mot du jour » encadré en fin de livre — page 12 marginalia).

## 5. Character bible seed (hero)

```
name: <hero_name>          age_band → body proportions
role: hero                 style: hand-painted watercolor (art-direction §1)
palette_lock: [ochre, sienna, dusty teal, bone]
anchors: "always facing the baobab when listening; never smiling at secrets"
```
Companion (if enabled): « Nzoma le martin-pêcheur » — small bird, teal accents.

## 6. Editorial pipeline (future state, schema-ready)

`editorial_status` flow: draft → in_review → published → archived.
Cultural validation requires `verified_by` (human) before `published`.
Generated cultural claims stored separately from verified facts — never conflated (§12).

## 7. Content to write in Phase 3 (seed script)

- `fr` narrative text ×3 age-band variants ×3 moral emphases (deterministic templates
  compose the 12 pages; AI variant produces a parallel `source='ai'` version)
- Page illustration prompts per page (12) + hero bible + companion bible
- Cover copy, back-cover colophon, dedication placeholder (« Pour <prénom>, avec tout mon amour »)
