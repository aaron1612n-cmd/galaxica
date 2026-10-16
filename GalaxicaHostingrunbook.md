# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Hosting
- Repo `aaron1612n-cmd/galaxica`. Static arcade in `public/`, served by Cloudflare Worker `play` (wrangler.jsonc assets ./public).
- LIVE: https://play.galaxica.workers.dev. Deploy: `npx wrangler deploy` (user approved deploys 2026-10-15; edge cache lags ~1 min). Pushing alone does not publish.
- Branches: work landed on `claude/determined-brown-9f1py4` (draft PR aaron1612n-cmd/galaxica#2, open, unmerged; main still at d27943c). Session 2026-10-16 branch `claude/keen-johnson-dabr2d` fast-forwarded to it (9d2fb0a). Live site = that state (25 games). Commit + push + deploy after each finished game.

## Structure
- Hub `public/index.html` reads `public/games.json` ({id,title,blurb,thumb}). Game = `public/games/<id>/index.html` + `thumb.jpg` (469x352).
- Old games (galaxica, squeeze, pinprick, hairline) use kit.js/theme.css. Gravity Garden is standalone (gg-*.js).
- New games use `shared/gk.js` + `gk2.js` + `gk.css` (plumbing only, no look): controls bar (`bar:'top|left|right|bottom'`, More drawer holds speed/sound/names/help/goals), fit, loop, pointer, wordless tutorial, GK.fx, GK.ico/icoSvg/icoDraw, GK.goals, GK.daily, Auto, Speed.

## Rules (user)
- Non-AI look: research refs, own palette (one accent), own fonts, no gradients/glow/glass/emoji. EVERY game its own identity AND its own bar skin + placement (`/* bar skin:` CSS). User: "everything looks the same" -> fixed; then liked it.
- Games have no instruction text; wordless first-run tutorial (skippable, `?` replays). Mobile + desktop, check screenshots at 390x800 and 1280x800.
- Every game: AUTO bot (Auto.on), speed-aware loop, goals, modes incl. daily.
- AUDIT BEFORE DONE (user was annoyed by missed bugs): open More panel, tutorial and a toast in every game at both sizes and look at the pixels. Checks: no clipped words, no ovals (kit panels use --gk-pr), tutorial/toasts placed via `--gk-ty/--gk-toy` (logical canvas units) away from the HUD, particles in WORLD coords drawn inside the camera transform, touch pad below canvas.
- Bots: exact short-horizon forward sims / BFS / time-expanded A* beat heuristics. Add a watchdog (same cell 5s or <=3 cells in 10s -> new plan).
- MOBILE (user 2026-10-15): must feel like an app, not a browser -> device.js app mode (no zoom/bubble/callout/long-press, manifest). Touch controls: never make a finger cover what it steers. Use relative drag (copy thumb movement x1.35-1.5), floating GK.stick thumbsticks, or a D-pad/pad row below the canvas; tap/swipe puzzles are fine. Desktop keyboard/mouse must stay unchanged; test touch with CDP Input.dispatchTouchEvent.

## Games (25 live)
galaxica, squeeze, pinprick, hairline, gravity-garden (challenges + #w= share links), powder-lab, tidewater, loom, moth-mail, cairn, tantrum, ant-kingdom, peg-song, switchyard, chirp (all with fun layer), floe, brass-pinball, ripple, cauldron, snail-rocket, deepdig, hedgerow, sneeze-heist, bramble, rube-garden. User favourites: Deepdig, Hedgerow.

## Python Answer Book (started 2026-10-16) `public/python/`
- User: "instead of a course make it like browsing... almost every answer, especially tkinter". Searchable Q&A reference, NOT lessons/editor (Pybench stays removed).
- Content: `tools/pyref/content/NN-*.txt` (`# id | Title | blurb | tkinter|python`, `@@ entry.id`, `Q:/A:/aka:/err:/see:` lines, markdown-ish body, ```py run|norun|bad|raises, ```text, ```sh, [[id|label]] links). `python3 tools/pyref/build.py` -> `public/python/data.js`; it RUNS every example (tk under xvfb, mainloop auto-closes, dialogs stubbed) with `/home/user/pyenv/bin/python` (uv Python 3.12 + Tk 9 + Pillow; recreate with `uv venv` if container is new). Build fails on any broken example or link.
- Site: index.html/style.css/app.js. Look = printed pocket reference: paper #f2ede3, ink #1b1a17, ONE accent vermilion #c23b22, Archivo Narrow + Source Serif 4 + IBM Plex Mono, double rule header, rail index (T1.., P1..), answer box, hatched "wrong" code. Motion moment = Copy button stamp. Search: inverted index + synonyms + prefix + typo (edit distance) + pasted-traceback error matching (`err:` patterns, `*` wildcard); fallback links to docs/Stack Overflow.
- DONE 2026-10-16: 414 answers / 26 sections (T1-T17 tkinter: windows, labels+buttons, text input, choices, layout, events, variables, timers+threads, menus+dialogs, canvas, images, style, tables/tabs/progress, app structure, tk errors, 11 complete apps, extras; P1-P9 python: basics, strings, lists, dicts, files, 31 error messages, classes, modules, common tasks). 430 examples all pass. Hub top bar links to it ('Python answers'). Search checked with ~70 real queries + pasted tracebacks (scratchpad searchq.mjs). Live: https://play.galaxica.workers.dev/python/
- To add answers: new `@@` entry in a content file (aka = phrases people would type; err = message patterns), rebuild, commit, deploy. Ideas: more recipes, pygame/turtle sections, user 'not found' log.

## NEXT
1. 2026-10-16: Python Answer Book shipped (above). Ask user what to add or which answers were missing.
2. Game ideas still open (dig- and hedge-like, user favourites Deepdig + Hedgerow).
3. Later: leaderboards, real-phone playtest, balance (Cauldron hard, Deepdig economy). Keep runbook under cap.

## Test kit (scratchpad, ephemeral)
http-server public -p 8080; bot.mjs (AUTO stats), waitshot.mjs, tutshot.mjs, thumb.mjs + crop.py, audit.mjs (overflow/oval/clip/pad checks + screenshots), addgame.py (games.json).
