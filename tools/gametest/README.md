# Game test kit
Serve first: `npx http-server public -p 8080 -s -c-1 &`
- `node shot.mjs games/<id>/ <out-prefix> "<js>" <waitms> '<localStorage json>'` - screenshots at 1280x800 (d) and 390x800 mobile (m), prints page errors.
- `OUT=<png> node bot.mjs games/<id>/ <secs> "<js>" 1280 800 '{"galaxicaAuto":"1","galaxicaSpeed":"50","gk_<id>_tut":"1"}'` - AUTO run, prints `__g.stats()` every 5 s.
- `node thumb.mjs games/<id>/ <out.jpg> "<js>" <waitms> '<ls>'` then `python3 thumbfix.py <out.png> public/games/<id>/thumb.jpg` (469x352).
