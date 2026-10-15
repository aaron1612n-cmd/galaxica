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

## GAME 5: GRAVITY GARDEN (2026-10-15) `public/games/gravity-garden/` — first game NOT in Galaxica style, standalone (no kit.js/theme.css)
Look: orrery plate. Cream paper #eee6d1, navy ink #1c2233, one rust #cf4a2c; Instrument Serif + DM Mono; hairline rules, sidebar ledger (desktop) / bottom bar (mobile). Motion moment = petals blooming on planets.
Sandbox: N-body leapfrog (G=1, dt .5x2 per tick). Tools 1-4: planet(m2)/star(400)/black hole(1500)/erase. TAP = stable circular orbit round dominant body; DRAG = aim+speed with dotted predicted path. Merges conserve momentum; planet m>=150 ignites, star m>=1200 -> hole. Total momentum zeroed on every add (else system drifts away). Planets in a star's habitable band (100-190 x sqrt(m/400)) bloom: 1 petal/150 ticks, max 12; blooms = score, best saved `ggBest`. Bodies past 1000 units culled.
AUTO = gardener: keeps <=5 planets on spaced ring slots in the band (moons removed from bot: too fragile). Wordless tutorial: tap ring -> drag arrow -> pulse speed box (skip/`?`). Keys 1-4, Space, R, M, A. Speed.js drives ticks. Headless debug hook `window.__gg`.
Ideas: pinch/zoom, save/share systems, comets, moons that survive.

## Git (2026-10-15)
DEPLOY RULE: pushing to main does NOT publish. After every game/change run `npx wrangler deploy` and verify the live games.json.
RULE: always work on and commit to `main`. Branches cool-dirac-fild0j and dazzling-johnson-mcnbcc (identical, 269d192) were fast-forward merged into main. Push main; no more side branches.

## Style rule
New games need NOT match Galaxica's look. Give each its own identity (research first); shared kit/theme.css are optional scaffolding, not a mandate.

## Next step
Real-phone playtest + balance pass; more games (research look first); custom domain? Redeploy: `npx wrangler deploy`.
