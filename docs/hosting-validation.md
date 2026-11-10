# Hosting validation and troubleshooting

Local results do not prove Namecheap compatibility. Complete this document only with observations from the real cPanel deployment.

## Acceptance record

| Test | Required evidence | Result |
| --- | --- | --- |
| Application starts | cPanel status is Started; no startup error in logs | Pending hosting access |
| Homepage over HTTPS | Browser receives HTTP 200 with a valid certificate | Pending hosting access |
| Public health API | `GET /api/health` returns HTTP 200 and sanitized JSON | Pending hosting access |
| MySQL | Authenticated database endpoint returns HTTP 200 and `status: ok` | Pending hosting access |
| Private filesystem | Authenticated storage endpoint returns HTTP 200 and `status: ok` | Pending hosting access |
| Static assets | `proof-mark.svg`, CSS, and `/_next/static` requests succeed | Pending hosting access |
| Restart persistence | Sentinel survives a real cPanel restart | Pending hosting access |

Do not mark Phase 0 complete until every row passes on Namecheap.

## Local preflight completed on 2026-11-10

These checks validate the project, not the hosting account:

| Local check | Observed result |
| --- | --- |
| Runtime | Node.js `v22.20.0`, Next.js `16.4.6` |
| Lint and TypeScript | Passed |
| Standalone production build | Passed; `server.js`, `public`, and `.next/static` present |
| Homepage | HTTP 200 with expected heading |
| Public health API | HTTP 200 with expected runtime metadata |
| Protected endpoint without token | HTTP 401 |
| Database without local credentials | Sanitized HTTP 503, as expected |
| Private storage probe | HTTP 200 |
| Public and Next.js static assets | HTTP 200 |
| Responsive browser check | 375 px and desktop layouts passed; no horizontal overflow |
| Browser console | No errors or warnings |
| Production dependency audit | 0 known vulnerabilities |

The MySQL success case and restart persistence case remain pending until the real Namecheap environment is available.

## Manual endpoint checks

Public endpoint:

```bash
curl --fail-with-body --show-error \
  "https://poc.example.com/api/health"
```

Protected endpoints:

```bash
curl --fail-with-body --show-error \
  -H "Authorization: Bearer $HEALTHCHECK_TOKEN" \
  "https://poc.example.com/api/health/database"

curl --fail-with-body --show-error \
  -H "Authorization: Bearer $HEALTHCHECK_TOKEN" \
  "https://poc.example.com/api/health/storage"
```

Without a valid token, the protected endpoints must return HTTP 401. If `HEALTHCHECK_TOKEN` is absent or shorter than 32 characters, they intentionally return HTTP 503.

## Troubleshooting

### The app does not start

1. Confirm the cPanel startup file is exactly `app.js`.
2. Confirm `.next/standalone/server.js` exists. If not, activate the cPanel Node environment and run `npm run build:cpanel`.
3. Confirm the selected Node version is 20.9 or newer; Node 22.x is recommended.
4. Do not define `PORT`. Passenger controls it.
5. Inspect the application logs shown by cPanel and the app's `logs/` directory. Do not copy secrets into support tickets.

### JavaScript or CSS returns 404

Run `npm run build:cpanel` again and verify both locations exist:

```bash
test -d .next/standalone/.next/static
test -f .next/standalone/public/proof-mark.svg
```

Confirm that cPanel's application root is the project root containing `app.js`, not `.next/standalone`.

### The database check fails

1. Verify the full cPanel-prefixed database and user names.
2. Confirm the user is assigned to the database.
3. Try `MYSQL_HOST=localhost` unless cPanel gives another host.
4. Confirm the password in cPanel has no accidental leading or trailing whitespace.
5. Keep `MYSQL_CONNECTION_LIMIT=3` on shared hosting.
6. For a local Namecheap MySQL service, keep `MYSQL_SSL=false`; use SSL only when Namecheap explicitly provides the required remote-connection settings.

The endpoint never returns driver messages, SQL text, credentials, hostnames, or stack traces. Use private application logs for diagnosis.

### The storage check fails

1. Confirm `PERSISTENT_STORAGE_DIR` is absolute on cPanel.
2. Keep it outside `public_html`.
3. Create it with the cPanel account owner and mode `700`.
4. Confirm the path is not a temporary deployment directory that cPanel replaces.

The endpoint never returns the absolute path.

### Environment-variable changes do not apply

Save the variables in **Setup Node.js App**, then restart the application. A shell session opened before the change may still contain old values; reactivate the Node environment or open a new terminal session.

### Build is killed or runs out of memory

Shared hosting can enforce memory and CPU limits. Build with the same Node major on a Linux CI runner, run `npm run build:cpanel`, then upload the complete generated `.next/standalone` tree with the source project. Do not use a Windows-built standalone artifact on the Linux host.

### HTTPS is unavailable

Verify that the subdomain points to the hosting account and that Namecheap SSL is issued and installed. Do not accept HTTP-only validation; the acceptance test explicitly requires HTTPS.

## Security checks

- Keep `.env*` files out of uploads when cPanel environment variables are used.
- Use a unique, random health token of at least 32 characters.
- Rotate the token after sharing diagnostic output.
- Do not expose the protected endpoint token in browser code or a `NEXT_PUBLIC_` variable.
- Leave the public `/api/health` lightweight; it performs no database or filesystem operation.
- The homepage probe is cached for 30 seconds per Node process to limit repeated database and filesystem work.
