# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Hosting
- Repo `aaron1612n-cmd/galaxica`. Static arcade in `public/`, served by Cloudflare Worker `play` (wrangler.jsonc assets ./public).
- LIVE: https://play.galaxica.workers.dev. Deploy: `npx wrangler deploy` (user approved deploys 2026-10-15; edge cache lags ~1 min). Pushing alone does not publish.
- BRANCH RULE (user, 2026-10-17, permanent): ALL work happens on `main`. Commit + push main + deploy after each finished change. If a session is handed a `claude/*` branch, fast-forward/merge it into main and keep working on main. 2026-10-17: every branch (cool-dirac, dazzling-johnson, determined-brown, keen-johnson, nice-lovelace, epic-babbage) merged into main (all fast-forward). Live site = main (25 games + Python Answer Book).

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

## Python Answer Book expansion (chat "Galaxica 5", 2026-10-16) - DONE + DEPLOYED
Branch `claude/nice-lovelace-x5im31`, draft PR aaron1612n-cmd/galaxica#4 (stacked on #3). 1371 answers / 79 sections / 1447 examples, 0 failures. Files: tk 00 (from zero: import *, root, mainloop...), 01-17 old, 30-46 (refs, depth, games, apps, methods A-Z, options A-Z, how-tos); py 19 (from zero, symbols, glossary), 20-28 old, 50-66 (depth, builtins, str/list/dict methods A-Z, exercises, tasks); modules 70-86 (group `modules`, rail M1..).
User feedback 2026-10-16: "doesn't even explain what from tkinter import * is, I NEED MORE" -> wants beginner fundamentals explained, not just how-tos. Keep adding depth.
Build: `python3 tools/pyref/build.py [--only idprefix]` (~90 s full). FAILS if a ```text block after a run block differs from real output, on invisible chars (Write tool turns \uXXXX into real chars: fix with python), on broken [[links]]/see:. Fake tk events need focus_force()+update(). TK_MS=3000 runs tk examples longer. Runner auto-closes turtle.
Env: `uv venv --managed-python -p 3.12 /home/user/pyenv` + pillow matplotlib numpy pandas openpyxl beautifulsoup4 flask requests (system python has no tk).
Search check: scratchpad search.js / q.js. Tune by adding phrases to `aka:`. Set outputs of strings are hash-order dependent: sort them (verify with PYTHONHASHSEED=1..3).

## NEXT: BIG IDEAS (proposed 2026-10-17, user: "lots of usage to burn", awaiting pick)
A Bot Arena (write your own AUTO bot in JS/Python, ranked) | B Galaxica Online (Worker+D1 global daily leaderboards, ghost replays) | C Party mode (phones as controllers, Durable Object rooms, 4-6 new party games) | D Deepdig full roguelite campaign | E Cabinet galaxy metagame (cross-game stars/quests/trophy room) | F Level editor + shared, solver-verified levels | G Answer Book "Run it" (Pyodide) + tkinter visual previews | H Attract/TV mode (AUTO plays all games). Older: more answers, phone playtest, balance.

## Test kit (scratchpad, ephemeral)
http-server public -p 8080; bot.mjs (AUTO stats), waitshot.mjs, tutshot.mjs, thumb.mjs + crop.py, audit.mjs (overflow/oval/clip/pad checks + screenshots), addgame.py (games.json).
