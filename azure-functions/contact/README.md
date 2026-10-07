# Contact function

Public `POST /api/contact` for the marketing form. The Vue app calls `{VITE_API_BASE_URL}/{VITE_CONTACT_FUNCTION}` (default `contact`) with the same `?code=` key as the other Azure Functions routes.

> **Production:** outpost13.app is served by a C# port of this function (`contact`, `Contact.cs`) inside the .NET isolated Function App in fox2-watchtower (`wt-health-dev-ok2`, behind `https://api.outpost13.app/api`). This Node folder is kept as the reference implementation and test suite for the contract below; it is not deployed. The C# port additionally returns `400 invalid_request` for an unparseable JSON body and `503 unavailable` when `TURNSTILE_SECRET_KEY` or `TURNSTILE_HOSTNAMES` is missing on the Function App.

This folder is a Node.js Azure Functions v4 app. fox2-watchtower is not in this repository. Publish this app only to a **Node** Function App. Do not publish it into a .NET-only Function App (one app cannot host both runtimes). If the live poller app must stay .NET, add a `contact` HTTP function there that follows the contract below.

## Contract

`POST /api/contact?code=<function-or-host-key>`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "What does a larger plan look like?",
  "turnstileToken": "<cf-turnstile-response>"
}
```

`cf-turnstile-response` is accepted as an alias of `turnstileToken`.

The function:

1. Rejects a missing, oversized, or malformed Turnstile token with `403` and does not store anything.
2. Calls Cloudflare Siteverify (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) with `TURNSTILE_SECRET_KEY`.
3. Requires `success === true`, `action === "contact"`, and `hostname` in `TURNSTILE_HOSTNAMES`.
4. In `AZURE_FUNCTIONS_ENVIRONMENT=Production`, drops `localhost`, `127.0.0.1`, and `::1` from that allowlist before the check. A production allowlist that only contains loopback hosts fails closed.
5. Validates name (1–120), email, and message (1–4000).
6. Writes the inquiry to Azure Table Storage. No SMS.

Success:

```json
{ "ok": true }
```

Errors (no field echo, no stack traces, no secrets):

| Status | Body |
| --- | --- |
| 400 | `{ "ok": false, "error": "invalid_request" }` |
| 403 | `{ "ok": false, "error": "verification_failed" }` |
| 503 | `{ "ok": false, "error": "unavailable" }` |

Siteverify network failures and a rejected token both return `verification_failed`.

## Storage

Each accepted inquiry is one row in table `ContactInquiries` (`CONTACT_TABLE_NAME` overrides the name):

- `partitionKey`: UTC date `YYYY-MM-DD`
- `rowKey`: random UUID
- `name`, `email`, `message`, `hostname` (the Turnstile hostname), `createdAt`

Connection string: `CONTACT_TABLE_CONNECTION`, or `AzureWebJobsStorage` when that is unset. The table is created on first use. Function logs record only the HTTP status and error code, not the message body.

## Function App settings

Set these on the Function App, not in the Static Web App / Vite environment:

| Name | Example | Notes |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | *(secret)* | Turnstile secret key. Never commit it. |
| `TURNSTILE_HOSTNAMES` | `outpost13.app` | Comma-separated frontend hostnames. Production must not rely on `localhost`. |
| `CONTACT_TABLE_NAME` | `ContactInquiries` | Optional. |
| `CONTACT_TABLE_CONNECTION` | *(connection string)* | Optional. Defaults to `AzureWebJobsStorage`. |
| `AzureWebJobsStorage` | *(connection string)* | Required by the Functions host. |

Also enable CORS on the Function App for the site origin (`https://outpost13.app`) and, for local Vite, `http://localhost:8080`. The SPA sends `Content-Type: application/json`, so the browser preflights. Azure Functions host CORS handles `OPTIONS` and does not require the function key on that preflight.

`authLevel` is `function`, matching the other routes that require `VITE_API_CODE`.

## Deploy

```bash
cd azure-functions/contact
npm install
# Azure Functions Core Tools, Node 20+
func azure functionapp publish <node-function-app-name>
```

Copy `local.settings.json.example` to `local.settings.json` for `func start`. That file is gitignored. Put the secret only in `local.settings.json` or the Function App settings.

Point the SPA at this app with `VITE_API_BASE_URL=https://<function-app>.azurewebsites.net/api` and `VITE_CONTACT_FUNCTION=contact`. The other dashboard routes must exist on that same base URL, because the SPA uses one API base.

## Turnstile keys for outpost13.app

1. Open the Cloudflare dashboard for the account that fronts outpost13.app.
2. Go to **Turnstile** → **Add widget**.
3. Name it `Outpost13 contact`. Hostname management mode: widget hostnames (not the account-wide zone list).
4. Add the production hostname `outpost13.app`. Add `www.outpost13.app` only if that host serves the SPA.
5. Create a **separate** widget for local development if you need `localhost` and `127.0.0.1`. Do not put loopback hosts on the production widget. The function checks the hostname Siteverify returns, and production strips loopback names.
6. Widget mode: **Managed**.
7. Copy the **site key** into the Static Web App (or Netlify) environment as `VITE_TURNSTILE_SITE_KEY`, then rebuild the SPA. The site key is public; it ships in the browser bundle.
8. Copy the **secret key** into the Function App setting `TURNSTILE_SECRET_KEY` only. Do not put it in `VITE_*` variables, the SWA configuration, or git.
9. Set `TURNSTILE_HOSTNAMES` to the same production hostnames, comma-separated, with no loopback names.
10. The widget sends `action=contact`. Siteverify must echo that action or the function rejects the token.

Cloudflare publishes test widgets for local checks: [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/). Use those only on a developer machine. Do not ship the always-pass test secret to Azure.

## Tests

```bash
cd azure-functions/contact
npm test
```

The handler tests do not call Cloudflare or Azure.
