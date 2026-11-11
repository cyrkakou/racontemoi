# MVP scope — what we build first

**Date:** 2026-11-11 · **Rule:** one complete 12-page pilot book experience before catalog expansion.

## In scope (MVP)

| Area | Deliverable |
|---|---|
| Marketing | Homepage (editorial, premium), catalog index, story detail for pilot book |
| Accounts | Register/login/logout, session, account page with project list |
| Studio | Personalization form → narrative generation (demo deterministic + optional AI variant) → page editor → approve |
| Illustrations | Character bible, per-page generation jobs, per-page regenerate, approve per page |
| Reader | Interactive spread reader with page-turn feel, progress resume |
| Export | PDF job → download |
| Ops | Job queue + cron runner, cost ledger, quotas, demo mode |
| Data | Full Drizzle schema + migrations for all directive §7 entities |
| Content | Pilot book **« Le Baobab aux Mille Secrets »** — 12 pages, 4 collections shells (empty states OK) |

## Out of scope (explicit cuts)

- Payments, pricing pages with checkout
- Photo upload / likeness references (schema fields exist, UI hidden)
- Collections beyond published pilot (catalog shows pilot + "bientôt" placeholders)
- Editor/admin UI (content seeded via migration/seed script)
- Email notifications (no transactional email in MVP)
- Multi-language
- Analytics beyond minimal server logs

## The pilot book — fixed parameters

- **Title:** Le Baobab aux Mille Secrets
- **Collection:** Contes & Légendes
- **Pages:** 12 (cover + 10 story spreads + back cover treated as page 12 asset)
- **Personalization points:** hero name, age band (3 tone / 6 tone / 9 tone — same plot, vocabulary depth varies), optional companion (friend character on/off), optional moral emphasis tag
- **Cultural grounding:** West-African savanna baobab folklore — inspiration, not claimed history; cultural context card marks it "inspiration culturelle, fiction originale"

## Definition of done (MVP)

- [ ] Fresh account → pilot book → approved story → 12 illustrations → reader → PDF, all in demo mode
- [ ] Same path in live mode behind `AI_PROVIDER=live`
- [ ] Kill -9 mid-job → cron recovers job on next tick
- [ ] Regenerate page 7 illustration → pages 1–6, 8–12 untouched
- [ ] Delete project → rows + files gone
- [ ] Mobile 375 px reader usable; keyboard reader navigation works
- [ ] `npm run lint && npm run typecheck` clean; `docs/` updated
