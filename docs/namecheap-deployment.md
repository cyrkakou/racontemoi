# Namecheap cPanel deployment

This procedure targets Namecheap Shared Hosting with **Setup Node.js App**. It uses no root access, Docker, PM2, or VPS-only feature.

## Compatibility decision

Next.js 16 requires Node.js 20.9 or newer. Namecheap currently lists Node.js 20, 22, and 24 on shared servers. Use **Node.js 22.x** in cPanel and use the same major version for the build.

The project uses `output: "standalone"`, but the generated `server.js` is not selected directly in cPanel. The root `app.js` adapter loads `.next/standalone/server.js`. It leaves `PORT` untouched so Passenger/CloudLinux can control reverse port binding. The build script explicitly copies `public/` and `.next/static/` because Next.js standalone output does not copy them automatically.

Use a dedicated HTTPS subdomain such as `poc.example.com`. This POC is not configured for a URL subpath such as `example.com/poc`.

## 1. Create private resources

In cPanel, create a MySQL database and user. Grant that user only the privileges required for this POC. `SELECT 1` does not require application tables.

From cPanel Terminal or SSH, create a storage directory outside `public_html`:

```bash
mkdir -p "$HOME/private/african-storybook-poc"
chmod 700 "$HOME/private/african-storybook-poc"
```

Create a strong health token locally. Do not paste the generated value into source files:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## 2. Upload and build

Upload `deployment/gpt_african-storybook-poc-source.zip` and extract it into a private application directory, for example:

```text
/home/CPANEL_USER/apps/african-storybook-poc
```

Do not place secrets in the archive. Enter the Node.js virtual environment using the activation command shown at the top of the **Setup Node.js App** page, then run:

```bash
cd "$HOME/apps/african-storybook-poc"
node --version
npm ci
npm run lint
npm run typecheck
npm run build:cpanel
test -f .next/standalone/server.js
test -f .next/standalone/public/proof-mark.svg
test -d .next/standalone/.next/static
```

The reported Node version must be at least 20.9 and should match the cPanel-selected major version. If a build on shared hosting exceeds resource limits, build on a Linux CI runner using the same Node major, run `npm run build:cpanel`, and upload the complete project including `.next/standalone`. Do not deploy a standalone directory built on Windows or macOS to Linux.

## 3. Configure Setup Node.js App

Use these exact settings:

| cPanel field | Value |
| --- | --- |
| Node.js version | `22.x` |
| Application mode | `Production` |
| Application root | `apps/african-storybook-poc` |
| Application URL | Dedicated HTTPS subdomain, for example `https://poc.example.com` |
| Application startup file | `app.js` |

Add these environment variables in cPanel:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HEALTHCHECK_TOKEN` | At least 32 random characters |
| `MYSQL_HOST` | Usually `localhost`; use the value shown by cPanel |
| `MYSQL_PORT` | `3306` unless cPanel specifies another port |
| `MYSQL_USER` | Full cPanel-prefixed database username |
| `MYSQL_PASSWORD` | Database user password |
| `MYSQL_DATABASE` | Full cPanel-prefixed database name |
| `MYSQL_CONNECTION_LIMIT` | `3` |
| `MYSQL_CONNECT_TIMEOUT_MS` | `5000` |
| `MYSQL_SSL` | `false` for a local cPanel database; follow the host's instructions for remote MySQL |
| `MYSQL_SSL_REJECT_UNAUTHORIZED` | `true` |
| `PERSISTENT_STORAGE_DIR` | `/home/CPANEL_USER/private/african-storybook-poc` |

Do **not** set `PORT`. Passenger manages the listening port. Never prefix a browser-visible variable with `NEXT_PUBLIC_` unless it is intentionally public.

Save the variables, then click **Restart**. If cPanel provides **Run NPM Install**, it may be used for `npm ci` dependencies, but the explicit build command must still complete before startup.

## 4. Validate over HTTPS

Set the token in the shell without committing it, then run the included remote test:

```bash
export BASE_URL="https://poc.example.com"
export HEALTHCHECK_TOKEN="the-token-entered-in-cpanel"
npm run test:remote
```

Also inspect the browser developer tools. The document, `proof-mark.svg`, CSS, and `/_next/static/...` requests must all return successful HTTPS responses with no mixed content.

## 5. Validate restart persistence

The storage endpoint deliberately deletes its temporary probe file. Use the separate sentinel to verify persistence:

```bash
export PERSISTENT_STORAGE_DIR="$HOME/private/african-storybook-poc"
node scripts/persistence-sentinel.mjs create
```

Restart the application in cPanel, then run:

```bash
node scripts/persistence-sentinel.mjs verify
node scripts/persistence-sentinel.mjs delete
```

Only mark the persistence acceptance test as passed after `verify` succeeds following the real cPanel restart.

## Updating the POC

Upload the changed source, activate the same Node environment, then run:

```bash
npm ci
npm run build:cpanel
```

Restart the app in cPanel. Re-run every validation check after changing dependencies, the Node version, the application root, environment variables, or the startup file.

## Continuous deployment with GitHub Actions

The repository includes `.github/workflows/gpt_deploy-namecheap.yml`. It runs on pushes to `main` and can also be started manually with **Run workflow**.

Create a GitHub environment named `production`, then configure these environment secrets:

- `SSH_USER`
- `SSH_HOST`
- `SSH_PORT`
- `SSH_PRIVATE_KEY`
- `SSH_KNOWN_HOSTS` — temporarily optional during Phase 0; required before production

Configure this required environment variable:

- `DEPLOY_PATH` — the same absolute cPanel application root configured in Setup Node.js App

Optional variable:

- `APP_URL` — the public HTTPS origin, for example `https://poc.example.com`. If omitted and `DEPLOY_PATH` ends with a domain directory such as `book.atikpa.com`, the workflow derives `https://book.atikpa.com` automatically.

The SSH key must be dedicated to deployment and authorized for the cPanel account. During Phase 0 only, the workflow falls back to `ssh-keyscan` when `SSH_KNOWN_HOSTS` is absent and emits a warning. Before production, store the independently verified host-key line for the exact SSH hostname in `SSH_KNOWN_HOSTS`; the workflow will then use strict host-key checking without dynamic discovery.

The workflow builds on Ubuntu with Node.js 22 and uploads only `app.js` plus `.next/standalone`. Synchronization with deletion is strictly scoped to `.next/standalone`; cPanel-managed root files, Passenger metadata, `tmp/`, logs, and `.env*` are never deleted. After activation, the workflow uses CloudLinux Selector to restart the application or start it when cPanel reports it as stopped, then also touches `tmp/restart.txt` for Passenger compatibility. It preserves cPanel's Passenger directives in `.htaccess` while maintaining an idempotent security block that disables directory indexing and denies direct HTTP access to runtime/configuration files. The public health check tolerates the temporary LiteSpeed 404 observed while Namecheap recycles the shared-hosting process. Runtime secrets such as MySQL credentials, `HEALTHCHECK_TOKEN`, and `PERSISTENT_STORAGE_DIR` remain server-managed and are never uploaded by the workflow.
