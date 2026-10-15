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

## Game / site structure (decided: collection of JS games added over time)
- Static arcade hub. `public/index.html` lists games from `public/games.json`.
- Each game = `public/games/<id>/index.html` (self-contained). To add a game: make the folder + append an entry to games.json.
- `wrangler.jsonc` serves `./public` as static assets -> `npx wrangler deploy`.
- Starter game: `galaxica` (canvas shooter, keyboard + touch). Syntax-checked only, not yet play-tested in browser.

## Deployed
- LIVE (primary, Workers): https://play.galaxica.workers.dev (worker `play`, name set in wrangler.jsonc).
- Redeploy: commit, then `npx wrangler deploy` (serves ./public).
- Decision 2026-10-14: use Workers (Cloudflare's focus platform), not Pages.
- Old copies DELETED 2026-10-14 (galaxica.pages.dev, galaxica-arcade + galaxica workers). Only `play` remains.

## Design direction: NON-AI look (2026-10-14, researched)
Research (prg.sh purple-gradient post, impeccable.style/slop, capitalandcompute fix-ai-slop): AI tells = purple/cyan gradients, glass cards, glow shadows, gradient text, Inter, centered hero + 3 cards, emoji icons.
Our identity: flat "star catalog / arcade cabinet". Ink #0b1016, paper #efe6d2, ONE accent amber #ffb000, red-orange #ff5a36 for enemies. Silkscreen (pixel) + IBM Plex Mono. Hard 4px offset shadows, square corners, pixel sprites (fillRect grids), flat square-pixel starfield, list/catalog layout (not cards). NO glow, blur, glass, gradients, gradient text, emoji.
RULE: games never explain themselves - no control hints, instructions or tutorial text in game UI or hub blurbs (restart/resume is silent: tap or Space/P). HUB (changed 2026-10-15 at user's request): each row = thumbnail + title + one-sentence description + PLAY. To add a game: folder, `thumb.jpg` (4:3 screenshot, make with Playwright), games.json entry {id,title,blurb,thumb}. Games themselves still have no instruction text. Controls must be obvious from the UI itself.
RULE: every game ships a first-run interactive tutorial: learn-by-doing steps, ONE word per step + animated visuals (keycaps on desktop, finger/pulsing button on mobile), progress pips, advances only when the player does the thing, Skip button, `?` button replays, seen-flag in localStorage. Galaxica: MOVE > FIRE > HIT IT > GO (Playwright-verified).
RULE: research before designing anything new (search refs, avoid documented AI tells); screenshot-test mobile+desktop before deploy.
Custom-rules paragraph for user's Claude settings: given in chat (begins "Design with a distinct, human look..."; add: games have no instruction text but ship a wordless first-run interactive tutorial, skippable and replayable).

## Galaxica (2026-10-14): 69 features shipped (11 enemies, 6 bosses, 14 power-ups, 3 ships, modes, daily seed, achievements, gamepad, mobile BOMB/dash). Controls: arrows/WASD, Space fire, Shift dash, B bomb, P pause, M mute.

## AUTO MODE (launcher-level) - RULE FOR EVERY GAME
User wants an auto mode that plays/beats each game for them; this is why the hub is a launcher. `public/shared/auto.js` = global `Auto` ({on,set,toggle,watch,bind}), stored in localStorage `galaxicaAuto`, synced across tabs. AUTO button on the hub top bar AND in every game's button bar (id `bot`; `Auto.bind(btn)`).
EVERY NEW GAME MUST: load auto.js, bind an AUTO button, and implement a bot that reads `Auto.on` (auto-start from menu, auto-skip tutorial, auto-restart/advance). Prefer deterministic puzzle games so a solver can record replay plans.
- Galaxica: heuristic bot (candidate-position danger scoring, target alignment, pickup chasing, bomb+dash use). Headless 25-min tests (90k frames): default/needle/brick ships and boss-rush all survive (wave 64+, lives 5-6). Endless game so "beating" = surviving.
- Squeeze: replay plans (`PLANS`, one char per 6 frames) found by BFS solver on the real physics; beats all 8 levels in ~30s, 0 deaths. If levels/physics change, RE-RUN the solver (BFS over dir x jump x toggle, 6-frame macro steps, key=x/6,y/6,size,vy,ground,plate,cracked) and regenerate PLANS. Auto turns itself off after the last level.

## UNIVERSAL SPEED + CONTROL BAR RULES
- `public/shared/speed.js`: global `Speed` (localStorage `galaxicaSpeed`, synced across tabs). Range 0.25-50x; typed values clamp (999 -> 50, 0.01 -> 0.25, junk ignored). Widget = text box + `1x` `2x` `MAX` buttons, auto-mounted into any `<span data-speed>`; it stops key events so typing never triggers game hotkeys.
- EVERY game loop: `n=Speed.steps()` then run n sim ticks per animation frame with a ~12ms time-budget guard (device limit = effective max); draw once. SFX off above 2.5x, music off above 1.5x. Verified: ticks/sec = 30/60/120/480/1484/2898 at .5/1/2/8/25/50x; Squeeze auto run 30s -> 3.8s at 8x.
- Button bar = 3 outlined clusters (`.cl`): [nav: Arcade/Levels/Restart] [run: AUTO + speed widget] [toggles: icons]. Icons + hover titles, no cryptic labels: speaker (SND, X when muted), monitor-with-lines (CRT = retro scanline filter), corners (fullscreen), `?` tutorial. Galaxica mobile toggle reads `AUTOFIRE ON/OFF` (hold-to-fire) - not the same as AUTO (bot plays).

## Game 2: SQUEEZE (2026-10-14) `public/games/squeeze/`
Puzzle platformer, one mechanic: toggle BIG/SMALL. Big (34px): high jump, smashes cracked blocks by walking into them, presses plates; can't fit 1-tile tunnels. Small (12px): fits tunnels, low jump, too light for plates. Toggle denied if no headroom. Plates latch doors open. Spikes (point UP, fixed 2026-10-14) kill; optional star per level.
8 levels + wordless tutorial (MOVE/JUMP/SIZE, skippable, `?` replays). Level select menu (progress/stars saved in localStorage). Desktop: A/D/arrows, Space/W/Up jump, X/Shift/Z/Down size, R restart. Mobile: pad row below canvas (L R SIZE JUMP).
Every level proven solvable by BFS solver driving the real physics (tools were scratchpad-only). Research basis: size gates paths, each size has a cost, teach early levels safely.
Ideas not yet built: ghost-replay game, sound-shaped world (echolocation), reverse bullet hell, wind painter.

## GAMES 3+4: the "hard for humans, easy for AUTO" pair (built 2026-10-14 from brainstorm items 1+2)
`public/shared/kit.js` = scaffolding for ALL NEW games: Kit.mount({W,H,pad,nav,tutStart,tutSkip}) builds canvas fit, 3-cluster bar (nav | AUTO+speed | sound/?/skip), pad row, mobile layout; Kit.run(tick,draw) = Speed-aware loop; Kit.tone/noise (global mute `galaxicaMute`), Kit.holdBtn, Kit.pt, Kit.keys/onPress. New games should use it (Galaxica/Squeeze predate it).
- PINPRICK (`games/pinprick`): 480x640 dodge-only bullet hell. Tiny visible hitbox, SHIFT / SLOW button = focus, graze counter, 3 difficulty icons (3 lives / 1 / 1, density .65/1/1.4), ramps every 15s to L8 (spirals, rings, aimed fan, gap-walls, rain, counter-spiral), CLEAR at 5:00. Wordless tutorial MOVE/SLOW/DODGE. Bot = time-expanded reachability planner (grid 5px, 34-frame horizon, exact bullet trajectories, replan every 4 ticks): 30 min headless on all difficulties, 0 hits. ~0.8ms/tick so effective max speed ~15-20x.
- PINPRICK HITBOX RULE (fixed 2026-10-15): collision must equal what is DRAWN. Core = 6x6 square, bullets = squares of half-size r; hit iff |dx|<r+3 && |dy|<r+3 (old circle test let diagonal overlaps through = 'hitbox doesn't work'). Bot danger radius = (r+3)*1.4143+2 so it covers the square's corners. Hit feedback: red screen flash + sound + 90f blink; tutorial hits flash but cost no life. Verified by overlap-matrix test + bot clears 5:00 on all difficulties. NOTE global AUTO flag persists: if AUTO is on the bot dodges everything, so a human may think hits don't register.
- HAIRLINE (`games/hairline`): one-button runner (auto-runs right, Space/tap = fixed-arc jump, no buffer/coyote), 40 platforms, 3 tiers (22/10/4px platforms; 4px = ~2-frame windows). Level generated deterministically per tier with a VERIFIED winning jump-frame plan (same `stepP` physics for generator and game); bot replays plan. Random tapper clears ~0.14 platforms on tier 3; bot clears all 40 in ~26s at 1x (<3s at 10x). Instant retry, same level every attempt (learnable). Fair-design research: instant respawn, opt-in harder tiers, gaps always exist in bullet patterns.
- Both: mobile+desktop, AUTO restarts/starts cleanly even if toggled mid-run, speed control, hub entries, icon bar.

## Layout rule
Mobile touch buttons (FIRE/BOMB) live in a `#pad` row BELOW the canvas, never overlaying the play area. fit() reserves height for bar+pad and re-runs on load/fonts ready. Verified iPhone 13 + SE: nothing overflows.

## Device system
- `public/shared/`: `theme.css`, `device.js` (html[data-device], window.Device, `[data-show]`), `stars.js` (hub starfield).
- EVERY game: theme.css + device.js, viewport-fit=cover, scale canvas + DPR, touch AND keyboard, first-run tutorial.

## GAME 5: GRAVITY GARDEN (2026-10-15) `public/games/gravity-garden/` — own look, standalone (no kit/theme.css)
Files: `gg-core.js` (data, names, N-body, life, stars, presets, save), `gg-view.js` (themes, engraved glyphs, renderer), `gg-ui.js` (palette, input, camera, inspector, modals, codex, goals, AUTO, tutorial, loop), `index.html` (CSS). Test hooks: `GG`, `GG.ui`.
Look: orrery plate, 3 themes (paper/night/blue; ink+bg+ONE accent), Instrument Serif + DM Mono, hairlines, no glow. Goals/UI are pictograms+numbers (no instruction text).
Content: 9 planet classes (own engraving each), 7 star classes + dwarf/neutron/hole, wormhole pairs, dark matter, repulsor, nebula (drag), moons/rocks/belts/comets/stations/binary pair; tools select/hand/erase/pull/push/anchor. 15 presets + seeded random systems (dice). ~800k procedural names; species glyphs; codex = 6237 (class x host x stage x size x moons) discoveries; 118 goals; 6 save slots + export/import code; undo(30); screenshot; autosave `ggWorld`; pan/zoom/pinch/follow; music = planets ping pentatonic notes on ring crossing.
Physics: G=1, leapfrog dt .5x2, heavy bodies attract all, LIGHT (moon/rock/comet/station) are test particles (cheap: 50x = 3000 ticks/s with 300 bodies). Planet masses tiny (.12-2.2) else mutual Hill instability (preset spacing matters). zeroMom on add. Merge conserves momentum; planet>=.8 -> gas, gas>=3.5 -> ringed.
Life: flux = sum lum*145^2/d^2 (lum=(m/400)^3). Class flux window -> habitable ticks `hab`; stages at THR [0,150,450,1800,5500,14600,32850] (microbes, flora/petals, fauna+species, city, stations, halo). Climate drift changes class (ocean<->desert/ice, lava). Stars live 450yr*(400/m)^2.5 (1yr=365 ticks): giant at 88% then dwarf / supernova->neutron or hole (blast sterilizes). Comets seed life, rocks cause extinctions.
AUTO = gardener: <=6 planets in the star's zone, one ringed giant with moons, rare comets.
Wordless tutorial: tap ring -> drag arrow -> pulse speed box (skip/`?`).
Ideas next: more presets, species interactions/wars, tides, sandbox challenges, shareable URLs.

## GAMES 6-15: TEN NEW GAMES (2026-10-15) — all use shared `public/shared/gk.js`+`gk.css` (Game Kit v2: NO look, only plumbing)
GK = GK.id/ls/rng, audio (tone/noise, shared mute), controls (back/pause/AUTO/speed/sound/? built from CSS vars --gk-bg/ink/acc/font/bw/r/sh/h), fit (letterbox), loop (Speed-aware), pointer(+keys), tutorial (wordless steps+pips+skip), pulse/swipe hint helpers. Each game: own page CSS = own identity. Test hook `window.__g={stats(),tut}` (+ per-game starters). `shared/matter.min.js` vendored for Cairn.
RESEARCH 2026-10-15: AI-design tells also include Instrument Serif, Space Grotesk, Geist, Plus Jakarta, Inter (Gravity Garden uses Instrument Serif: swap if redesigning).
1 powder-lab: falling-sand alchemy, 30 elements, 53 reactions logged in notebook (stamp pops), graph-paper look (Special Elite/Reenie Beanie). AUTO = experimenter targeting undiscovered reactions.
2 tidewater: woodblock print tide puzzle; moon gauge sets tide 0-4; tiles passable if lo<=L<=hi (bridges), pearls+lighthouse; endless generated levels verified by BFS (needs tide changes), 60 levels/stars; AUTO = BFS solver.
3 loom: rhythm; 4 lanes mirrored to 8 warp threads, hits stitch a cross-stitch cloth; 12 procedural bolts + dice; holds; synth backing from chart.
4 moth-mail: boids swarm delivering letters at night; lamps recruit, zappers/bats/owls kill; quota per night + upgrade cards; portrait uses taller world.
5 cairn: Matter.js stone stacking in wind; hoverY, wind accel formula in px/step^2; AUTO simulates candidate drops on a copy world.
6 tantrum: crayon bullet-hell vs toddler (5 moods x 3 phases, rounds loop); AUTO = 16-frame rollout dodger. Mobile: finger offset 70px above touch.
7 ant-kingdom: ant farm; pheromone trails + BFS maps (nest/surface/dig/threat); tools dig/sugar/pebble/erase; seasons, beetles, spiders, brood; portrait uses narrow tall grid.
8 peg-song: Peggle-like, every peg a note, 10 shots, bucket, power pegs=multiball, compose mode; stuck-ball rescue after 2s.
9 switchyard: Swiss timetable; Galton lattice of switches, trains by colour pattern (red/ring/bars); tap switch=throw, tap train=hold; AUTO assigns each switch to next train.
10 chirp: chalk bat cave; echolocation LOS reveal (walls/moths/spiders/owls/stalactites), stereo-panned echo clicks, cave from cellular automata + BFS exit; AUTO uses true map.
All AUTO bots verified headless (desktop+iPhone viewport, no JS errors). TODO ideas: leaderboards, daily seeds, real-phone playtest, balance pass (ant stores huge under bot, cairn strikes).

## FIXES + POLISH (2026-10-15, user feedback)
- Powder Lab bug: GK.pointer already returns LOGICAL units (W,H passed to GK.fit); a game that draws at css px must multiply by view.s. Powder wrongly divided by css size -> fixed. Verified with real mouse/touch input tests (all 10 games respond where you click).
- NAMES MODE: button (i) in every GK bar + kit.js bar (old games) + Gravity Garden; puts the button's title under it; persisted in localStorage `galaxicaNames`. Vials/tiles use data-cap via GK MutationObserver.
- GK: bar z-index 40 (modals no longer cover back/names), pause overlay (tap to resume), auto-pause on tab hide now auto-resumes, removed the 'A' key = AUTO hotkey (conflicted with moving left).
- Ant Kingdom keeps Dig tool after tutorial; Cairn ignores the click that starts a run.

## Git (2026-10-15)
DEPLOY RULE: pushing to main does NOT publish. After every game/change run `npx wrangler deploy` and verify the live games.json.
RULE: always work on and commit to `main`. Branches cool-dirac-fild0j and dazzling-johnson-mcnbcc (identical, 269d192) were fast-forward merged into main. Push main; no more side branches.

## Style rule
New games need NOT match Galaxica's look. Give each its own identity (research first); shared kit/theme.css are optional scaffolding, not a mandate.

## Next step
Real-phone playtest + balance pass; more games (research look first); custom domain? Redeploy: `npx wrangler deploy`.
