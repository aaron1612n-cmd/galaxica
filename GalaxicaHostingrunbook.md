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
- RULE CHANGE (user 2026-10-17, "many games don't really explain much"): every game gets a SHORT illustrated 'How to play' card behind `?` (a few plain sentences + pictures of every enemy/tile/pickup), AND longer wordless tutorials covering every mechanic. Still no instruction text on the play screen itself. AUTO bot, speed-aware loop, goals, modes incl. daily.
- AUDIT before done: screenshots 1280x800 + 390x800 of tutorial, menus, overlays, toasts; no clipped words; real keyboard/mouse/CDP-touch input test; long headless AUTO run with no errors.
- Mobile = app feel; fingers never cover what they steer (relative drag, GK.stick, pad below canvas).
- Bots: exact sims/BFS beat heuristics; add watchdogs.
- KEEP RUNNING (user 2026-10-17): all loops call `Speed.run(tick,paused)` (speed.js): frame gaps >250ms owed as ticks (x speed, cap 8h) and caught up 28ms/frame (badge with time left), hidden tab driven by 1s setInterval (250ms budget), sfx muted while `Speed.ff`. No auto-pause on hide. New games MUST use GK.loop/Kit.run/Speed.run. Phone-off = catch-up on wake (JS can't run while asleep; a discarded tab reloads fresh).
- TIMER (user): every GK More panel shows time played (`Speed.ticks`/60). Old-bar games (galaxica, squeeze, pinprick, hairline, gravity-garden) have no More panel.
- DEPLOY REGULARLY (after each playable step) so the user can test.

## Games (31 live)
galaxica, squeeze, pinprick, hairline, gravity-garden, powder-lab, tidewater, loom, moth-mail, cairn, tantrum, ant-kingdom, peg-song, switchyard, chirp, floe, brass-pinball, ripple, cauldron, snail-rocket, deepdig, hedgerow, sneeze-heist, bramble, rube-garden, bonfire, angler, lamplight, putt, sounding, duckling-parade. Favourites: Deepdig, Hedgerow.
- BONFIRE (2026-10-17) `games/bonfire/` index.html+bonfire.js: survivors-like; papercut night (#10140f, bone #e7dcc4, ember #ff6a1f, Pirata One, tag bar left rail). 10 weapons (8 lv) + 12 charms, evolve = weapon lv8 + paired charm + chest; 10 heroes (gold unlock, Reaper by winning), 3 stages (unlock: survive 10:00 on previous), modes Night/Hurry/Endless/Daily, bosses 5/10/15 min, Hearth meta shop. Bot = 16-dir danger sampling; usually wins 15:00 with damage. Balance knobs: need(), hpMul(), director spawn rate.
- ANGLER `games/angler/` (index.html+angler.js): gyotaku look (paper #f1ebdd, sumi #1d1b19, seal #b3202a, Shippori Mincho B1, brush-square bar right rail; night inverts). Hold=charge cast/raise lure/reel; tap=strike on bite. 60 species (SP table) in 5 waters, legends idx 11/23/35/47/59, tension fight (snap >1, slack), rod/reel/line/hook upgrades, 7 baits, journal of ink prints. Modes career/derby/daily (3 min kg). Bot casts at best-value fish, holds depth, tension controller.
- LAMPLIGHT `games/lamplight/`: Art Deco poster (sea #0f3b3a, cream #efe3c8, lamp #f2b705, Limelight, double-rule bar top). Tap water=place / then \ then remove; tap bolted ring mirror=rotate. 60 seeded levels (params(n): rot from ch2, splitter ch3, 2 lighthouses ch4, spare ch5), built along a planned beam path; solve() = DFS deciding cells as light reaches them; par = min mirrors; crate K = par+spare; stars by mirrors used. Modes voyage/watch(endless)/daily. Bot replays solver answer (all 60 x3 stars).
- PUTT `games/putt/`: riso 2-ink (paper #f4efe4, green #00835f, pink #ff4f9a multiply + offset, halftone patterns, Bowlby One SC, ticket-stub bar bottom). Drag anywhere to pull back; arrows+Space. Holes = seeded cell paths (tryHole) with posts/bumpers/sand/water/slopes/mills/bars/tunnels; bestShot() searches angle x power with exact sim; par = clamp(botStrokes+1,2,5); holes past d>.08 must not be bot-aceable. 3 courses x18 (unlock in order), free play, daily nine.
- SOUNDING `games/sounding/`: nautical chart (white #f7f5ee, shoal #cde3e6, navy #1f2a33, magenta #c0267c, Libre Caslon italic, scale-bar bar left rail). Minesweeper-like on square+hex; tap sound, hold/right-click/pad buoy, chord. gen() re-rolls until provable() (deduce: basic+subset+frontier enumeration+count) clears from the pre-opened start: NO GUESSING. 40 survey charts, free S/M/L, daily. Bot = deduce().
- DUCKLING PARADE `games/duckling-parade/parade.js`: lemmings-like, cut-paper picture book (cream #f3ead2, earth #8a5a3b, ink #2b2622, yolk #ffcf33, Gluten, skill pad #pad + egg rate, torn-label bar bottom). Cell terrain (CELL 4, LH 90) with offscreen dirty-cell repaint. Jobs stop/build(12 bricks, 1:2)/dig/bash/float/climb; builders+bashers+stoppers block walkers. build() strings segments pit/thorns/wall/floor/step/steel/drop each with a plan window; trial() simulates whole parade with planStep(); kept if >=70% saved. 30 levels, endless, daily; stuck-detect ends level after 25s of no change.

## Python Answer Book `public/python/` (live /python/)
1371 answers / 79 sections / 1447 run-checked examples. Content `tools/pyref/content/NN-*.txt`; build `python3 tools/pyref/build.py` (needs `/home/user/pyenv`: `uv venv --managed-python -p 3.12` + pillow etc; runs every example, fails on wrong output/broken links). User wants beginner fundamentals explained ("I NEED MORE").

## ONLINE + BOT WORKSHOP (A+B, 2026-10-17, LIVE)
- Worker `worker/index.js` (wrangler main; assets run_worker_first /api/*) + D1 `galaxica` (binding DB, migrations/). API: GET /api/top?game&board&kind&low&pid, POST /api/score {game,board,score,low,pid,kind,name,bot,ghost}, GET /api/mine?pid&kind, GET /api/ghost?id, POST /api/name. One row per owner (pid, or pid:botname). Rate limit 40/min/IP. Test locally: `npx wrangler dev --port 8787` (+ `d1 migrations apply galaxica --local`). Clean test rows with `wrangler d1 execute galaxica --remote`.
- shared/online.js (Online.post/top/open/watch/button; pid+name in localStorage). gk2.js auto-loads it; GK.online.mount(R,{game,boards}) in all 26 GK games (metric boards poll goals metrics; daily boards read dstreak best with inv/scale). Old-bar games: Online.watch+button injected before </body>. Putt posts course totals with shot-log ghosts and races them.
- Bot profiles in auto.js: Auto.profile {n,p,i,c,s{rea,acc,cau,gre,agg,pat,mis,foc,tem}}, 30 PRESETS, helpers think/react/slip/noise/w/st. Games with Auto.deep=true use stats directly (bonfire, angler, lamplight, putt, sounding, duckling-parade); others get the tempo/focus gate in Speed.run. AUTO runs post to the 'bot' boards. Page `public/workshop/` (hub look, linked from hub top bar).

- GUIDES DONE (all 31): shared/guide.js card (Guide.set cfg {title,goal,how,keys,touch,legend[{pic|ic|sw,name,note}],tips}); GK games call GK.guide(cfg); old-bar games inline Guide.set + Guide.attach(helpBtnSelector) (card first, its Tutorial button runs the old handler).
- BOT RACE (user "let multiple bots run"): Workshop > Race: lineup of up to 9 lanes (4 on phone), each {bot, game}; Start race = grid of iframes `games/<id>/?bot=<profile json>&lane=n&x=speed`. auto.js lane mode: Proxy in-memory localStorage (copies pid/name/tut flags only), muted AudioContext, hides .gk-bar, posts {t:'score'|'tick'} to parent; parent sets speed via postMessage {pin:'speed'}. Ranks lanes when all play the same game.

## NEXT
1. Deeper wordless tutorials covering every mechanic, all games.
2. D Deepdig full roguelite campaign.
REJECTED: party mode, cabinet galaxy/level editor/Run-it/attract mode.
