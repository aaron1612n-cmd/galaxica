# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate. Update proactively.

## Hosting + git
- Repo `aaron1612n-cmd/galaxica`; static arcade `public/` served by Cloudflare Worker `play` (wrangler.jsonc). LIVE https://play.galaxica.workers.dev
- Deploy `npx wrangler deploy` (user approved earlier; wrangler logged in). Push alone does not publish. NOTE 2026-10-17: auto-mode classifier denied `wrangler deploy` ('Production Deploy'): user must add a Bash permission rule for it (or deploy themselves).
- BRANCH RULE (user, permanent): work on `main`, commit+push after each finished change. Sessions handed a `claude/*` branch work there (session 2026-10-17 pm: `claude/friendly-cray-9yekgc`, PR to main) and the user merges.
- Always commit when ready. Local test servers: `npx http-server public -p 8080 -s -c-1`, `npx wrangler dev --port 8787` (for /api). Test kit `tools/gametest/` (shot/bot/thumb) + Playwright at /opt/node22/lib/node_modules/playwright.

## Structure
- Hub `public/games.json` {id,title,blurb,added,thumb}. Game = `public/games/<id>/` + `thumb.jpg` 469x352. 31 games.
- Old games: kit.js/theme.css (galaxica, squeeze, pinprick, hairline) + gravity-garden standalone. New: `shared/gk.js`+`gk2.js`+`gk.css`: GK.controls, fit, loop(Speed), pointer, tutorial(steps{init,update,draw,done}), fx, ico, goals, daily, stick, guide. `canvas#c{touch-action:none}` needed per game. Test hook `window.__g`.
- Worker `worker/index.js` + D1 `galaxica` (online boards, ghosts, /api/*). Bot workshop `public/workshop/` (AUTO profiles in auto.js, bot race lanes).
- Python Answer Book `public/python/` (tools/pyref, 1371 answers; user wants beginner fundamentals explained).

## Rules (user)
- Non-AI look: own palette (ONE accent), own fonts (not Inter/Space Grotesk/etc.), no gradients/glow/glass/emoji; each game own identity.
- Every game: short illustrated 'How to play' card behind `?` (DONE, all 31) + wordless interactive tutorial (<=1 word per step, skippable, replayable) that teaches EVERY item in the card by doing; no instruction text on play screen. AUTO bot, Speed.run loop (KEEP RUNNING when hidden), goals, daily, time-played in GK More panel.
- Audit before done: screenshots 1280x800 + 390x800, real keyboard/mouse/touch test, no clipped text. Mobile = app feel.
- DEPLOY after playable steps. REJECTED: party mode, cabinet galaxy/level editor/Run-it/attract mode.

## TASK IN PROGRESS: deeper tutorials (2026-10-17 pm session, one commit per game, all pushed)
- DONE (extra stages added + tested with real input): galaxica, squeeze, pinprick, hairline, gravity-garden, powder-lab, tidewater, loom, moth-mail, cairn, tantrum, ant-kingdom, peg-song, switchyard, chirp, floe, brass-pinball, ripple, cauldron, snail-rocket, hedgerow, sneeze-heist, bramble. Several tutorials had real bugs fixed on the way (switchyard counter, snail landing, ant dig hint, floe/ripple/hedgerow needed tap after win -> now auto-advance).
- Also done: rube-garden, bonfire, angler, lamplight, putt, sounding. duckling-parade: dig/bash/float/stop/egg stages added, levels load OK but only checked by loading (not played); NO climb stage (the forced 'wallc' level was unwinnable by the bot plan and fell back to the pit level - fix build() if wanted).
- TODO: deepdig (tutorial deepening + Expedition). Not yet done anywhere: 390px mobile screenshot audit of the new stages; deploy. Method: read tutorial + `Guide.set/GK.guide` card, add stages per uncovered item (stage hazards relative to player path, re-stage on fail, watchdogs), test with Playwright real input, commit+push.
- Then: Deepdig 'Expedition' roguelite (5 biomes + bosses, camps/relics, Hall meta, story plates, bombs, bot support; code already moved to games/deepdig/deepdig.js).
- Open question: close PRs #3/#4 (content already on main).
