# Hosting feasibility — Phase 0

**Date:** 2026-11-11 · **Author:** Devin (agent) · **Status:** VERIFIED on production server

This document records measured evidence from the live Namecheap deployment, not assumptions.
Companion documents: `docs/namecheap-deployment.md` (procedure), `docs/hosting-validation.md` (acceptance record).

## 1. Verified facts (measured 2026-11-11)

| Capability | Evidence | Verdict |
|---|---|---|
| Next.js 16.4.6 production runtime | `GET https://book.atikpa.com/api/health` → `{"runtime":{"node":"v22.23.4","next":"16.4.6"}}`, HTTP 200 | PASS — standalone output + `app.js` Passenger adapter works |
| HTTPS + routing | Homepage HTTP 200; `/_next/static` assets served; `.htaccess` Passenger block intact | PASS |
| MySQL connectivity via Drizzle/mysql2 | Homepage probe "MySQL connectivity: Available" after `.env` fix; direct `mysql` CLI auth test `SELECT 1` → `ok` | PASS |
| Database engine | `mysql --version` → `11.4.13-MariaDB` — the server runs **MariaDB**, not Oracle MySQL | Compatible; design for MariaDB semantics |
| Private filesystem | `~/private/` exists (`drwx------`); storage probe "Available"; `PERSISTENT_STORAGE_DIR` unset → `app.js` default `/home/nkankreone/private/african-storybook-poc` applies | PASS |
| Node.js versions | `/opt/alt/alt-nodejs6` … `alt-nodejs26` installed; app venv `~/nodevenv/book.atikpa.com/22` | Node 22 selected; 20/24/26 also selectable in cPanel |
| Cron | `crontab -l` works; cPanel Cron Jobs UI available; only acme.sh renewal currently scheduled | PASS — job runner feasible |
| PHP fallback | `php -v` → PHP 8.5.12 CLI at `/usr/local/bin/php` | Available if ever needed |
| Deployment pipeline | `.github/workflows/gpt_deploy-namecheap.yml` builds on Ubuntu/Node 22, rsyncs `app.js` + `.next/standalone`, restarts via CloudLinux Selector | In place; last deploy live |
| Disk | `df ~` → 969 GB free on `/home` | No constraint for MVP |
| Process limits | `ulimit -v` unlimited, `-u` 527 746; cgroup v1 files absent | LVE limits enforced by CloudLinux, **not readable** from user shell |

## 2. Constraints that shape the architecture

These are the hard limits the product design must respect:

1. **No permanently running worker.** Passenger recycles Node processes; idle apps can be stopped.
   → All background work must be MySQL-backed jobs executed by bounded cron invocations.
2. **Bounded request execution.** Shared-hosting entry processes and LiteSpeed timeouts make
   long-running route handlers unreliable (typical ceiling tens of seconds, exact value not measurable).
   → AI generation and PDF export never run inside a user-facing request; they are jobs.
3. **Unknown but finite memory/CPU (CloudLinux LVE).** Cannot be read from the account.
   → Design for a conservative envelope: treat ~1 GB RAM and short CPU bursts as the working assumption;
   avoid native modules (`sharp`, `canvas`) entirely; stream or chunk large work.
4. **Single-writer assumptions are unsafe.** Multiple Passenger workers can run concurrently.
   → Job claiming must be atomic in MySQL (`UPDATE … WHERE status='PENDING'`), not in-process locks.
5. **MariaDB, not MySQL.** Use portable SQL; MariaDB 11.4 supports everything Drizzle needs.
   `GET_LOCK()` exists but per-connection semantics make `UPDATE`-based claiming simpler and sufficient.
6. **Filesystem persistence only.** `~/private` survives deploys (workflow never deletes it) and restarts.
   → All durable state = MySQL + `~/private`; nothing important in memory or `/tmp`.
7. **Outbound HTTP is available** (Node 22 `fetch`, curl). AI providers are called server-side only.
8. **Email:** cPanel mailbox/SMTP available on the account (Namecheap includes email).
   Transactional email for MVP auth can use cPanel SMTP or defer to password-only auth.

## 3. Feasibility verdict per directive §6 checklist

| # | Check | Result |
|---|---|---|
| 1 | Node versions | 20/22/24/26 selectable; **22.x in use** |
| 2 | Next.js compatibility | 16.4.6 runs (proven live) |
| 3 | cPanel startup mechanism | CloudLinux Passenger via `.htaccess` + `app.js` adapter — verified |
| 4 | Minimal production build | `.next/standalone` deployed and serving |
| 5 | Startup + HTTP routing | Homepage + API routes 200 over HTTPS |
| 6 | MySQL via Drizzle | Probe green; real auth test passed |
| 7 | Private persistent storage | Probe green; `~/private` mode 700 |
| 8 | Cron execution | crontab functional; pattern proven by acme.sh job |
| 9 | CPU/memory/time limits | **Partially measurable** — LVE opaque; conservative design adopted |
| 10 | AI/PDF impact | Long generations → job queue; PDF via pure-JS `pdf-lib` (no native deps); image bytes stored as received, no `sharp` |

**Phase 0 conclusion: direct Next.js hosting is feasible. The fallback architecture (static frontend + PHP API) is NOT needed.**

## 4. Known risks carried into Phase 1+

- **R1 — LVE kills.** A memory-hungry PDF/image job could be killed mid-run. Mitigation: small batches, per-page checkpointing in `generation_jobs.progress`, idempotent retries.
- **R2 — Cold starts.** After idle, first request pays Passenger spawn cost (~1–3 s observed pattern). Mitigation: keep homepage light, accept it; warm via cron health ping if needed.
- **R3 — No SSE guarantee.** Long-lived Server-Sent Events through LiteSpeed/Passenger are unreliable. Mitigation: job status via short polling (2–5 s) on progress endpoints.
- **R4 — Single Node version drift.** Build must target Node 22 (CI already does). Never build standalone on Windows for Linux deploy.
- **R5 — Shared MySQL load.** `MYSQL_CONNECTION_LIMIT=3` already set; keep pool small; cron runner uses its own short-lived pool.
- **R6 — Secrets in `.env` on server.** Currently the only secrets store; acceptable for MVP, document rotation.

## 5. Not examined / skipped

- Exact LVE memory/CPU/EP limits (not readable without root or cPanel metrics UI).
- LiteSpeed per-request timeout value (not published; treated as ~30–60 s design budget).
- Whether cPanel "Setup Node.js App" env vars and `.env` file coexist predictably — currently `.env` is the effective source (`app.js` `loadEnvFile`); Node's documented behavior gives existing `process.env` precedence, but both should be kept in sync.
- Outbound bandwidth/egress throttling for large AI asset downloads (assumed fine; monitor).
