# Cloudflare Ownership

## Canonical split

Se'kret Bip uses two distinct Cloudflare deployment targets.

### `sekret-backend` — backend Worker

Verified in `wrangler.toml`, EAS profiles, the Worker identity contract, and Cloudflare preview deployments:

- Worker name: `sekret-backend`
- Entry point: `worker/observed-index.ts`
- Production endpoint: `https://sekret-backend.mcgill-raylene.workers.dev`

Responsibilities:

- authenticated API routes
- Supabase access and authorization checks
- OpenAI requests
- Se'kret reply generation
- Bridge Summary generation
- safety scanning
- Oracle and voice services
- push and other backend business logic

The mobile and web clients call this backend through `EXPO_PUBLIC_BACKEND_URL`.

### `sekret` — frontend Cloudflare Pages project

Owner-confirmed role:

- host the Expo web export
- serve the purchased custom domain
- deliver frontend routes and static assets
- bootstrap the React Native Web application

The repository deploys the frontend through `.github/workflows/deploy-cloudflare.yml` using:

- `npm run build:web`
- `wrangler pages deploy dist`
- repository variable `CLOUDFLARE_PAGES_PROJECT_NAME`

The production value of `CLOUDFLARE_PAGES_PROJECT_NAME` must be verified as `sekret` in GitHub and Cloudflare before release. The repository does not contain that dashboard value.

## Request flow

```text
Custom domain
    |
    v
Cloudflare Pages project: sekret
    |
    v
Expo web frontend
    |
    v
Cloudflare Worker: sekret-backend
    |
    +--> Supabase
    +--> OpenAI
    +--> Bridge
    +--> Safety
    +--> Oracle / Voice
```

## Ownership rules

- Frontend assets, Expo routes, and browser delivery belong to the `sekret` Pages project.
- API routes, secrets, database access, and business logic belong to the `sekret-backend` Worker.
- Never place service-role credentials or OpenAI credentials in the frontend deployment.
- Never rename the backend Worker to `sekret` merely to match the domain or frontend project.
- Before changing deployment code, verify both the repository configuration and the actual Cloudflare/GitHub environment values.

## Release verification

Backend:

```bash
npx wrangler deployments list --name sekret-backend
```

Frontend:

- confirm `CLOUDFLARE_PAGES_PROJECT_NAME=sekret`
- confirm the custom domain is attached to the `sekret` Pages project
- confirm the deployed Pages commit matches the intended repository commit
- confirm `EXPO_PUBLIC_BACKEND_URL` points to `https://sekret-backend.mcgill-raylene.workers.dev`
