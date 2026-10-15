# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Hosting
- Repo `aaron1612n-cmd/galaxica`. Static arcade in `public/`, served by Cloudflare Worker `play` (wrangler.jsonc assets ./public).
- LIVE: https://play.galaxica.workers.dev. Deploy: `npx wrangler deploy` (user approved deploys 2026-10-15; edge cache lags ~1 min). Pushing alone does not publish.
- Branch this session: `claude/determined-brown-9f1py4`, draft PR aaron1612n-cmd/galaxica#2 (no CI). Commit + push + deploy after each finished game.

## Structure
- Hub `public/index.html` reads `public/games.json` ({id,title,blurb,thumb}). Game = `public/games/<id>/index.html` + `thumb.jpg` (469x352).
- Old games (galaxica, squeeze, pinprick, hairline) use kit.js/theme.css. Gravity Garden is standalone (gg-*.js).
- New games use `shared/gk.js` + `gk2.js` + `gk.css` (plumbing only, no look): controls bar (`bar:'top|left|right|bottom'`, More drawer holds speed/sound/names/help/goals), fit, loop, pointer, wordless tutorial, GK.fx, GK.ico/icoSvg/icoDraw, GK.goals, GK.daily, Auto, Speed.

## Rules (user)
- Non-AI look: research refs, own palette (one accent), own fonts, no gradients/glow/glass/emoji. EVERY game its own identity AND its own bar skin + placement (`/* bar skin:` CSS). User: "everything looks the same" -> fixed; then liked it.
- Games have no instruction text; wordless first-run tutorial (skippable, `?` replays). Mobile + desktop, check screenshots at 390x800 and 1280x800.
- Every game: AUTO bot (Auto.on), speed-aware loop, goals, modes incl. daily.
- AUDIT BEFORE DONE (user was annoyed by missed bugs): open More panel, tutorial and a toast in every game at both sizes and look at the pixels. Checks: no clipped words, no ovals (kit panels use --gk-pr), tutorial/toasts placed via `--gk-ty/--gk-toy` (logical canvas units) away from the HUD, particles in WORLD coords drawn inside the camera transform, touch pad below canvas.
- Bots: exact short-horizon forward sims / BFS / time-expanded A* beat heuristics.

## Games (26 live)
galaxica, squeeze, pinprick, hairline, gravity-garden (challenges + #w= share links), powder-lab, tidewater, loom, moth-mail, cairn, tantrum, ant-kingdom, peg-song, switchyard, chirp (all with fun layer), floe, brass-pinball, ripple, cauldron, snail-rocket, deepdig, hedgerow, sneeze-heist.

## NEXT
1. Build the last 2 new games: Bramble, Rube Garden (own look, tutorial, bot, goals, thumb, games.json), then audit + deploy.
2. Later ideas: leaderboards, real-phone playtest, balance (Cauldron hard, Deepdig economy), runbook stays under cap.

## Test kit (scratchpad, ephemeral)
http-server public -p 8080; bot.mjs (AUTO stats), waitshot.mjs, tutshot.mjs, thumb.mjs + crop.py, audit.mjs (overflow/oval/clip/pad checks + screenshots), addgame.py (games.json).
