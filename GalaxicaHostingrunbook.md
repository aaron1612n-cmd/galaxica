# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Goal
Host website(s) AND the Galaxica game for repo `aaron1612n-cmd/galaxica` using Cloudflare Wrangler.

## Decisions
- Runbook: `GalaxicaHostingrunbook.md` (repo root), updated proactively each turn.
- Branch: `claude/cool-dirac-fild0j`. Commit when ready; open draft PR after push.
- Deploy method: `npx wrangler` (no global install).
  - Static: `npx wrangler pages deploy ./dist --project-name=galaxica`
  - Worker/app: add `wrangler.jsonc`, `npx wrangler deploy`
- Confirm with user before first deploy / any overwrite of an existing project.

## Prerequisites (status)
- [ ] `CLOUDFLARE_API_TOKEN` as environment secret (never paste in chat)
- [ ] `CLOUDFLARE_ACCOUNT_ID` as environment secret
- [ ] Network policy allows `api.cloudflare.com` + npm registry
- [x] Site content exists (hub + 1 game)

## Current state
- Hub + starter game scaffolded on PR #1 branch.
- Draft PR #1 open (runbook), subscribed; no CI/reviews yet.

## Game / site structure (decided: collection of JS games added over time)
- Static arcade hub. `public/index.html` lists games from `public/games.json`.
- Each game = `public/games/<id>/index.html` (self-contained). To add a game: make the folder + append an entry to games.json.
- `wrangler.jsonc` serves `./public` as static assets -> `npx wrangler deploy`.
- Starter game: `galaxica` (canvas shooter, keyboard + touch). Syntax-checked only, not yet play-tested in browser.

## Open questions
- Next game ideas? Playtest/feedback on galaxica?
- Custom domain or `*.pages.dev`/`*.workers.dev`?
- Cloudflare secrets + network allowlist still needed before deploy.
