# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Goal
Host website(s) for repo `aaron1612n-cmd/galaxica` using Cloudflare Wrangler.

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
- [ ] Site content exists

## Current state
- Repo contains only README.md (initial commit). No site yet.

## Open questions
- Which site: existing in repo, or build a new one? What is it?
- Pages (static) vs Worker?
- Custom domain or `*.pages.dev`?
