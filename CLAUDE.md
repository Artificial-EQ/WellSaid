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
- `src/routes/+page.server.ts` — four form actions: `generate` (summary + replies), `translate` (raw draft → polished short/medium/long), `settings`, `inferProfile` (AI-inferred psychological profile from loaded messages)
- `src/routes/login/` — credential check, sets `auth_token` JWT cookie
- `src/lib/components/ThemePicker.svelte` — floating accent/dark-mode picker; call `loadSaved()` on mount via `bind:this` to restore localStorage prefs

## Settings

Settings are persisted in `settings.db` (project root). Env vars in `.env` seed initial values but the UI settings form is the source of truth at runtime. Use `updateSetting()` from `src/lib/config.ts` to update programmatically.

Key settings keys: `CONTACT_PHONE`, `HISTORY_LOOKBACK_HOURS`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GROK_API_KEY`, `GROK_MODEL`, `KHOJ_API_URL`, `KHOJ_AGENT`.

Psychological profile keys (all optional; omitted from prompt when empty): `PARTNER_NAME`, `PARTNER_STORY`, `PARTNER_TRIGGERS`, `PARTNER_NEEDS`, `MY_STORY`, `MY_TRIGGERS`, `MY_NEEDS`. Profile context is assembled in `src/lib/prompts.ts:buildProfileContext()` and injected into `systemContext()`.

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

## UI theming

- Color system: OKLch semantic tokens in `src/variables.css` (`--bg`, `--surface`, `--card`, `--text`, `--border`, `--accent`, `--accent-soft`, `--accent-text`); shadow tokens `--shadow-sm/md/lg`
- Typography: `--heading-font` (Cormorant Garamond), `--body-font` (Lora), `--label-font` (DM Sans)
- Dark mode: `[data-theme="dark"]` on `<html>`; accent variants via `[data-accent="sage|indigo|amber|rose"]`
- Legacy aliases (`--primary-dark`, `--primary-light`, `--light`, `--white`, `--gray`) exist for backwards compat — prefer semantic tokens in new code

## Adding a provider

Add an entry to `PROVIDER_REGISTRY` in `src/lib/providers/registry.ts`, implement a client module in `src/lib/`, and wire it into the `generate`, `translate`, and provider-selector logic in `+page.server.ts` and `+page.svelte`.
