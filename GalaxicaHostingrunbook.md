# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Goal
Host website(s) AND the Galaxica game for repo `aaron1612n-cmd/galaxica` using Cloudflare Wrangler.

## Decisions
- Runbook: `GalaxicaHostingrunbook.md` (repo root), updated proactively each turn.
- Branch: `claude/cool-dirac-fild0j`. Commit when ready; open draft PR after push.
- Deploy method: `npx wrangler` (no global install).
  - Static: `npx wrangler pages deploy ./dist --project-name=galaxica-arcade`
  - Worker/app: add `wrangler.jsonc`, `npx wrangler deploy`
- Confirm with user before first deploy / any overwrite of an existing project.

## Prerequisites (status)
- [x] `CLOUDFLARE_API_TOKEN` env secret — set
- [x] `CLOUDFLARE_ACCOUNT_ID` env secret — set
- [x] Network: api.cloudflare.com + npm reachable (verified)
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

## Deployed
- LIVE (primary, Workers): https://play.galaxica.workers.dev (worker `play`, name set in wrangler.jsonc).
- Redeploy: commit, then `npx wrangler deploy` (serves ./public).
- Decision 2026-10-14: use Workers (Cloudflare's focus platform), not Pages.
- Old copies DELETED 2026-10-14 (galaxica.pages.dev, galaxica-arcade + galaxica workers). Only `play` remains.

## Design direction: NON-AI look (2026-10-14, researched)
Research (prg.sh purple-gradient post, impeccable.style/slop, capitalandcompute fix-ai-slop): AI tells = purple/cyan gradients, glass cards, glow shadows, gradient text, Inter, centered hero + 3 cards, emoji icons.
Our identity: flat "star catalog / arcade cabinet". Ink #0b1016, paper #efe6d2, ONE accent amber #ffb000, red-orange #ff5a36 for enemies. Silkscreen (pixel) + IBM Plex Mono. Hard 4px offset shadows, square corners, pixel sprites (fillRect grids), flat square-pixel starfield, list/catalog layout (not cards). NO glow, blur, glass, gradients, gradient text, emoji.
RULE: games never explain themselves - no control hints, instructions or tutorial text in game UI or hub blurbs (restart/resume is silent: tap or Space/P). The hub has NO description text at all (no tagline, footer, input labels or blurbs): just title, catalog rows, PLAY. Controls must be obvious from the UI itself.
RULE: every game ships a first-run interactive tutorial: learn-by-doing steps, ONE word per step + animated visuals (keycaps on desktop, finger/pulsing button on mobile), progress pips, advances only when the player does the thing, Skip button, `?` button replays, seen-flag in localStorage. Galaxica: MOVE > FIRE > HIT IT > GO (Playwright-verified).
RULE: research before designing anything new (search refs, avoid documented AI tells); screenshot-test mobile+desktop before deploy.
Custom-rules paragraph for user's Claude settings: given in chat (begins "Design with a distinct, human look..."; add: games have no instruction text but ship a wordless first-run interactive tutorial, skippable and replayable).

## Galaxica: 69 features (shipped 2026-10-14)
Enemies 11: zigzag, sine-wave, diver, shooter, tank, splitter, homing kamikaze, shielded, mine-layer, V formations, asteroids.
Bosses 6: every 5th wave, health bar, 3 phases, fan+spiral patterns, boss-rush mode, hit-stop mega explosion.
Power-ups 14: spread, rapid, shield, bomb, 1UP, laser, homing missiles, slow-mo, magnet, x2 score, wingmen, piercing, buff timer chips, weapon levels (stars).
Player 10: 2D movement, dash, i-frames, smart bomb, 3 ships, engine trail, charge shot (fills by kills/graze), visible hitbox core, 1UP every 5000, graze scoring.
Progression 10: combo+multiplier, combo timer line, waves+banner, difficulty ramp, difficulty select, top-5 table per mode, end stats/accuracy, 6 achievements, daily seeded mode, wave-clear bonus.
FX 9: 3-layer parallax, shake, hit flash, score popups, planets, sector palettes (every 5 waves), shockwave rings, debris, CRT toggle.
Audio 3: synth SFX, chiptune loop, mute (SND/M).
UX 6: haptics, gamepad, saved settings, icon menu (ship/mode/difficulty), pause (P/Esc/tab hidden), mobile BOMB btn + double-tap dash.
Controls (desktop): arrows/WASD move, Space fire, Shift dash, B bomb, P pause, M mute. Mobile: drag, FIRE, BOMB, double-tap dash, auto-fire toggle.
Research basis (shmup design notes): visible tiny hitbox, graze risk/reward, multi-phase bosses, power-ups as decisions. Stress-tested in Playwright (desktop+iPhone), no JS errors. Tutorial retained.

## Game 2: SQUEEZE (2026-10-14) `public/games/squeeze/`
Puzzle platformer, one mechanic: toggle BIG/SMALL. Big (34px): high jump, smashes cracked blocks by walking into them, presses plates; can't fit 1-tile tunnels. Small (12px): fits tunnels, low jump, too light for plates. Toggle denied if no headroom. Plates latch doors open. Spikes kill; optional star per level.
8 levels + wordless tutorial (MOVE/JUMP/SIZE, skippable, `?` replays). Level select menu (progress/stars saved in localStorage). Desktop: A/D/arrows, Space/W/Up jump, X/Shift/Z/Down size, R restart. Mobile: pad row below canvas (L R SIZE JUMP).
Every level proven solvable by BFS solver driving the real physics (tools were scratchpad-only). Research basis: size gates paths, each size has a cost, teach early levels safely.
Ideas not yet built: ghost-replay game, sound-shaped world (echolocation), reverse bullet hell, wind painter.

## Layout rule
Mobile touch buttons (FIRE/BOMB) live in a `#pad` row BELOW the canvas, never overlaying the play area. fit() reserves height for bar+pad and re-runs on load/fonts ready. Verified iPhone 13 + SE: nothing overflows.

## Device system
- `public/shared/`: `theme.css`, `device.js` (html[data-device], window.Device, `[data-show]`), `stars.js` (hub starfield).
- EVERY game: theme.css + device.js, viewport-fit=cover, scale canvas + DPR, touch AND keyboard, first-run tutorial.

## Next step
Real-phone playtest + balance pass; more games (research look first); custom domain? Redeploy: `npx wrangler deploy`.
