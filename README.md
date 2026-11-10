# African Storybook — Namecheap hosting proof of concept

Phase 0 validates that a real Namecheap shared-hosting account can run the minimum server-side capabilities required by the future African Storybook SaaS. It intentionally contains no product features.

## What it validates

- Next.js 16 running under Node.js on cPanel/Passenger
- a public health endpoint
- protected MySQL and private-filesystem diagnostics
- Drizzle ORM over `mysql2`
- standalone production output and static assets
- runtime environment variables
- persistent local storage across an application restart

## Local setup

Requirements: Node.js 20.9 or newer. Node.js 22 LTS is recommended because it is currently offered by Namecheap shared hosting.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Fill the MySQL variables in `.env.local` if a local MySQL server is available. Never commit `.env.local`.

Open `http://localhost:3000`. The public endpoint is `GET /api/health`. The database and storage endpoints require either `Authorization: Bearer <HEALTHCHECK_TOKEN>` or `x-health-token: <HEALTHCHECK_TOKEN>`.

## Quality and production checks

```bash
npm run lint
npm run typecheck
npm run build:cpanel
npm run start:cpanel
```

`build:cpanel` creates the standalone Next.js server and copies `public/` plus `.next/static/` into `.next/standalone/`. The root `app.js` is the cPanel startup adapter; it does not implement a custom Next.js server.

## Deployment

Read [docs/namecheap-deployment.md](docs/namecheap-deployment.md) for the exact cPanel values and commands. Record the real-host results in [docs/hosting-validation.md](docs/hosting-validation.md).

Phase 0 is not complete until every hosting acceptance test is observed on the real HTTPS Namecheap deployment. A successful local build is necessary but not sufficient.

## Primary references

- [Next.js installation and Node.js requirement](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Namecheap: Setup Node.js App](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/)
- [Namecheap shared-server software versions](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/)
