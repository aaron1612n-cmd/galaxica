# GalaxicaHosting runbook
Purpose: resume this chat with full context. Cap ~1,500 tokens; condense, don't truncate.

## Hosting + git
- Repo `aaron1612n-cmd/galaxica`; static arcade `public/` served by Cloudflare Worker `play` (wrangler.jsonc). LIVE https://play.galaxica.workers.dev
- Deploy `npx wrangler deploy` (user approved; wrangler is logged in). Push alone does not publish. Verify live games.json.
- BRANCH RULE (permanent): ALL work on `main`; commit+push+deploy after each finished change. Handed a `claude/*` branch -> merge into main, work on main. All old branches merged 2026-10-17.

## Structure
- Hub reads `public/games.json` {id,title,blurb,added,thumb}. Game = `public/games/<id>/` + `thumb.jpg` 469x352 (canvas crop, no UI).
- Old games use kit.js/theme.css; Gravity Garden standalone. New games: `shared/gk.js`+`gk2.js`+`gk.css` (plumbing only): GK.controls (bar top|left|right|bottom, More drawer), fit, loop (Speed), pointer, tutorial, fx, ico/icoSvg/icoDraw (extend GK.ico per game), goals, daily, stick. Test hook `window.__g={stats(),tut,...}`.
- GOTCHA: device.js sets canvas touch-action:manipulation -> each game needs `canvas#c{touch-action:none}` or touch drags get cancelled.
- Test kit committed in `tools/gametest/` (shot/bot/thumb, see README).

## Rules (user)
- Non-AI look: research first; own palette (ONE accent), own fonts (not Inter/Instrument Serif/Space Grotesk/Geist), no gradients/glow/glass/emoji; each game own identity + own bar skin/placement.
- No instruction text in games; wordless first-run tutorial (skip, `?` replays). AUTO bot, speed-aware loop, goals, modes incl. daily.
- AUDIT before done: screenshots 1280x800 + 390x800 of tutorial, menus, overlays, toasts; no clipped words; real keyboard/mouse/CDP-touch input test; long headless AUTO run with no errors.
- Mobile = app feel; fingers never cover what they steer (relative drag, GK.stick, pad below canvas).
- Bots: exact sims/BFS beat heuristics; add watchdogs.
- KEEP RUNNING (user 2026-10-17): all loops call `Speed.run(tick,paused)` (speed.js): frame gaps >250ms owed as ticks (x speed, cap 8h) and caught up 28ms/frame (badge with time left), hidden tab driven by 1s setInterval (250ms budget), sfx muted while `Speed.ff`. No auto-pause on hide. New games MUST use GK.loop/Kit.run/Speed.run. Phone-off = catch-up on wake (JS can't run while asleep; a discarded tab reloads fresh).
- TIMER (user): every GK More panel shows time played (`Speed.ticks`/60). Old-bar games (galaxica, squeeze, pinprick, hairline, gravity-garden) have no More panel.
- DEPLOY REGULARLY (after each playable step) so the user can test.

## Games (28 live)
galaxica, squeeze, pinprick, hairline, gravity-garden, powder-lab, tidewater, loom, moth-mail, cairn, tantrum, ant-kingdom, peg-song, switchyard, chirp, floe, brass-pinball, ripple, cauldron, snail-rocket, deepdig, hedgerow, sneeze-heist, bramble, rube-garden, bonfire, angler, lamplight. Favourites: Deepdig, Hedgerow.
- BONFIRE (2026-10-17) `games/bonfire/` index.html+bonfire.js: survivors-like; papercut night (#10140f, bone #e7dcc4, ember #ff6a1f, Pirata One, tag bar left rail). 10 weapons (8 lv) + 12 charms, evolve = weapon lv8 + paired charm + chest; 10 heroes (gold unlock, Reaper by winning), 3 stages (unlock: survive 10:00 on previous), modes Night/Hurry/Endless/Daily, bosses 5/10/15 min, Hearth meta shop. Bot = 16-dir danger sampling; usually wins 15:00 with damage. Balance knobs: need(), hpMul(), director spawn rate.
- ANGLER `games/angler/` (index.html+angler.js): gyotaku look (paper #f1ebdd, sumi #1d1b19, seal #b3202a, Shippori Mincho B1, brush-square bar right rail; night inverts). Hold=charge cast/raise lure/reel; tap=strike on bite. 60 species (SP table) in 5 waters, legends idx 11/23/35/47/59, tension fight (snap >1, slack), rod/reel/line/hook upgrades, 7 baits, journal of ink prints. Modes career/derby/daily (3 min kg). Bot casts at best-value fish, holds depth, tension controller.
- LAMPLIGHT `games/lamplight/`: Art Deco poster (sea #0f3b3a, cream #efe3c8, lamp #f2b705, Limelight, double-rule bar top). Tap water=place / then \ then remove; tap bolted ring mirror=rotate. 60 seeded levels (params(n): rot from ch2, splitter ch3, 2 lighthouses ch4, spare ch5), built along a planned beam path; solve() = DFS deciding cells as light reaches them; par = min mirrors; crate K = par+spare; stars by mirrors used. Modes voyage/watch(endless)/daily. Bot replays solver answer (all 60 x3 stars).

## Python Answer Book `public/python/` (live /python/)
1371 answers / 79 sections / 1447 run-checked examples. Content `tools/pyref/content/NN-*.txt`; build `python3 tools/pyref/build.py` (needs `/home/user/pyenv`: `uv venv --managed-python -p 3.12` + pillow etc; runs every example, fails on wrong output/broken links). User wants beginner fundamentals explained ("I NEED MORE").

## NEXT (user picks 2026-10-17, in order)
1. NEW GAMES batch 3: Bonfire, Angler, Lamplight DONE; next Putt (mini golf), Sounding (sonar minesweeper, no-guess), Duckling Parade (lemmings-like).
2. A Bot Workshop: NO coding; create menu editing bot stats (reaction, aim, caution, greed, aggression, mistakes...) + LOTS of presets; bots play games, scored. B Galaxica Online: Worker+D1 global/daily leaderboards, ghost replays.
3. D Deepdig full roguelite campaign.
REJECTED: party mode, cabinet galaxy/level editor/Run-it/attract mode.
