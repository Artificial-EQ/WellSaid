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
yarn format       # Prettier (format:check to verify only)
yarn run check    # svelte-kit sync + svelte-check — must use `run`; bare `yarn check` is Yarn 1's built-in dependency check
yarn test         # Vitest (single run)
yarn test:watch   # Vitest watch mode
yarn test:coverage
yarn prune        # knip dead-code check (production)
yarn prune:list   # knip (all files)
```

## Architecture

- `src/hooks.server.ts` — JWT auth guard; all routes except `/login` (including `/health`) require a valid `auth_token` cookie
- `src/lib/config.ts` — settings loaded from `settings.db` (SQLite) at startup; env vars seed defaults on first run
- `src/lib/providers/registry.ts` — provider registry and `getDefaultProvider()` (defaults to OpenAI, falls back to first available)
- `src/lib/provider.ts` — `DEFAULT_PROVIDER` is computed once at module load (null if none configured); adding a provider key via settings won't change the default until the server restarts
- `src/lib/iMessages.ts` — reads `~/Library/Messages/chat.db`; requires Full Disk Access for the terminal/editor
- `src/lib/history.ts` — fetches extra context from the `HISTORY_LOOKBACK_HOURS` window before the loaded messages
- `src/lib/prompts.ts` — AI prompt construction
- `src/lib/openAi.ts`, `anthropic.ts`, `grok.ts`, `khoj.ts` — per-provider API clients
- `src/routes/+page.server.ts` — four form actions: `generate` (summary + replies), `translate` (raw draft → polished short/medium/long), `settings`, `inferProfile` (AI-inferred psychological profile from loaded messages)
- `src/routes/login/` — credential check, sets `auth_token` JWT cookie
- `src/lib/components/ThemePicker.svelte` — floating accent/dark-mode picker; call `loadSaved()` on mount via `bind:this` to restore localStorage prefs

## Settings

Settings are persisted in `settings.db` (project root). Env vars in `.env` seed initial values (`INSERT OR IGNORE` — only on first run per key) but the UI settings form is the source of truth at runtime. Use `updateSetting()` from `src/lib/config.ts` to update programmatically; new keys must be added to `defaultSettings` in `src/lib/config.ts` so they're seeded and shown in the settings form.

Key settings keys: `CONTACT_PHONE`, `HISTORY_LOOKBACK_HOURS`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GROK_API_KEY`, `GROK_MODEL`, `KHOJ_API_URL`, `KHOJ_AGENT`, plus per-provider `*_TEMPERATURE` and OpenAI sampling keys (`OPENAI_TOP_P`, `OPENAI_FREQUENCY_PENALTY`, `OPENAI_PRESENCE_PENALTY`).

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

## Testing

- Tests live in `tests/` mirroring `src/` (not colocated)
- `$env/static/private` and `$env/dynamic/private` are aliased to `tests/mocks/` in `vitest.config.ts` — add any new `$env` import there or tests fail to resolve it

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

Add an entry to `PROVIDER_REGISTRY` in `src/lib/providers/registry.ts`, implement a client module in `src/lib/` exporting reply/translate/inferProfile functions (see `anthropic.ts`), add its keys to `defaultSettings` in `config.ts`, and wire it into the provider ternaries in the `generate`, `translate`, and `inferProfile` actions in `+page.server.ts` plus the provider selector in `+page.svelte`.
