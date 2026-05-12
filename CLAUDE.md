# WellSaid

SvelteKit app that reads the macOS Messages database and uses an AI provider to generate conversation summaries and reply suggestions.

## Commands

```bash
yarn dev          # dev server with hot-reload (port 5173)
yarn build        # production build
yarn preview      # run production build locally
yarn prepare      # regenerate SvelteKit types (run after clone)
yarn lint         # ESLint
yarn lint:fix     # ESLint with auto-fix
yarn format       # Prettier
yarn check        # svelte-check + tsc
yarn test         # Vitest (single run)
yarn test:watch   # Vitest watch mode
yarn test:coverage
yarn prune        # knip dead-code check (production)
yarn prune:list   # knip (all files)
```

## Architecture

- `src/hooks.server.ts` — JWT auth guard; all routes except `/login` require a valid `auth_token` cookie
- `src/lib/config.ts` — settings loaded from `settings.db` (SQLite) at startup; env vars seed defaults on first run
- `src/lib/providers/registry.ts` — provider registry and `getDefaultProvider()` (defaults to OpenAI, falls back to first available)
- `src/lib/provider.ts` — safe module-level init of `DEFAULT_PROVIDER` (null if none configured)
- `src/lib/iMessages.ts` — reads `~/Library/Messages/chat.db`; requires Full Disk Access for the terminal/editor
- `src/lib/prompts.ts` — AI prompt construction
- `src/lib/openAi.ts`, `anthropic.ts`, `grok.ts`, `khoj.ts` — per-provider API clients
- `src/routes/+page.server.ts` — main form actions (summarize, suggest replies)
- `src/routes/login/` — credential check, sets `auth_token` JWT cookie

## Settings

Settings are persisted in `settings.db` (project root). Env vars in `.env` seed initial values but the UI settings form is the source of truth at runtime. Use `updateSetting()` from `src/lib/config.ts` to update programmatically.

Key settings keys: `CONTACT_PHONE`, `HISTORY_LOOKBACK_HOURS`, `CUSTOM_CONTEXT`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GROK_API_KEY`, `GROK_MODEL`, `KHOJ_API_URL`, `KHOJ_AGENT`.

## Required env vars (`.env`)

```
APP_USERNAME=        # login username
APP_PASSWORD=        # login password
JWT_SECRET=          # generate: openssl rand -base64 64
LOG_LEVEL=info       # info | debug | warn | error
ALLOWED_HOST=        # Tailscale hostname, or omit for local-only
```

AI provider keys go in settings.db (via UI or `.env` seed): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROK_API_KEY`, `KHOJ_API_URL`.

## HTTPS / Tailscale

Place `cert.pem` and `key.pem` in `.certs/` at project root — Vite auto-detects them and enables HTTPS (`vite.config.ts:23-33`). Generate with `mkcert <tailscale-hostname> localhost`.

## macOS requirement

- Must run on a Mac signed into iCloud — reads `~/Library/Messages/chat.db` directly
- Terminal and/or editor must have **Full Disk Access** (System Settings → Privacy & Security)
- Not deployable to a server; `yarn build && yarn preview` is the "production" mode

## Adding a provider

Add an entry to `PROVIDER_REGISTRY` in `src/lib/providers/registry.ts`, implement a client module in `src/lib/`, and wire it into the route action.
