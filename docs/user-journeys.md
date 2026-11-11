# User journeys — Racontemoi MVP

**Date:** 2026-11-11 · All copy French · Journey IDs stable for reference in tickets.

## J1 — Discover (anonymous)

Homepage → scroll: hero (pilot book object) → collections shelf → cultural note → CTA « Commencer un livre ».
Catalog `/histoires` → story card → `/histoires/le-baobab-aux-mille-secrets` detail:
synopsis, « ce que vous personnalisez », sample spread, cultural-context card
(« Inspiration culturelle — fiction originale »), CTA « Créer mon livre » → signup gate.

**Emotion target:** calm confidence; the book feels already real before signup.

## J2 — Account

`/inscription`: email + password + parent name. Minimal fields, privacy line:
« Nous demandons le moins possible : un prénom suffit pour votre enfant. »
Login returns to the story that triggered signup (deep link preserved).
Errors in plain French near the field.

## J3 — Personalize (studio step 1)

`/creer/[templateId]` — « Atelier » layout:
- Left: hero card — prénom (required), tranche d'âge (3–5 / 6–8 / 9–12 pills),
  traits optionnels (couleur de peau, cheveux, tenue — texte libre borné 60 car.),
  compagnon on/off, accent moral (chips from schema).
- Right: live « page de garde » proof — cover mock updates as they type (debounced).
- CTA « Écrire l'histoire » → creates project + enqueues narrative job → status page.

**Rules:** no photo upload in MVP; no free prompt box; choices constrained to schema.

## J4 — Narrative (studio step 2)

Status view: « L'écrivain travaille… » (atelier indicator, honest ETA ~1 min demo / variable live).
On completion: spread reader preview of the 12 pages (text + placeholder art),
version picker if AI variant exists (« Version atelier » vs « Version originale »),
per-page edit (pencil → inline textarea, saved as `source='edited'` version),
CTA « Approuver l'histoire » → locks `approved_story_version_id`.

## J5 — Illustrations (studio step 3)

Character bible card shown for transparency: « Voici comment votre enfant apparaîtra » —
canonical description + style swatches + (live mode) reference note.
« Illustrer le livre » → 12 page jobs enqueued (batched by cron). Progress: shelf of 12
thumbnails filling in; per-page states; per-page « Régénérer » (cost-confirmed in live mode);
per-page « Approuver ». Pages can be approved independently.

**Cost UX (live):** before first live generation, modal: « ~X illustrations ≈ fourchette de coût »
with « Confirmer ». Demo mode: no modal, « Démo » badges everywhere.

## J6 — Read (reader)

`/projets/[id]/reader`: book object centered on desk background; page-turn physics;
spread = verso/recto; keyboard ←/→, space, swipe; progress hairline; « Réécouter » not in MVP.
Mobile: full-width spread, tap zones. Reduced motion: slide cut.
CTA exit → back to project (« Continuer plus tard » — progress persists).

## J7 — Export

`/projets/[id]/exporter`: summary (12 pages, approved assets count), « Télécharger le PDF »
→ export job → « Votre livre est prêt » → download via authorized file route.
Exports list keeps last N files; re-export allowed (new job, idempotent).

## J8 — Account & lifecycle

`/compte`: project cards (cover thumb, title, status, last opened), « Reprendre » / « Supprimer ».
Delete → confirm dialog (« Cette action est définitive ») → soft-delete → purge job.
No email notifications in MVP — status lives in-app.

## Cross-cutting states

- **Empty catalog beyond pilot:** collection cards show « Bientôt » + count — honest, not broken.
- **Job failure:** inline error card with « Réessayer » (re-enqueues same idempotency family).
- **Quota exceeded:** friendly French message + « Mode démo toujours disponible ».
- **Session expired mid-studio:** redirect to login → back to same step (state in project row).
- **Slow connection:** all generation states are server-truth (job rows), UI polls `/api/jobs/[id]`
  every 3 s — no optimistic lies.
