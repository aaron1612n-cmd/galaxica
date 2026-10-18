/* Pip, the Answer Book buddy: asks /api/buddy (Workers AI), grounded in the entries the book's own search finds. */
(function () {
  'use strict';
  var R = window.__pyref; if (!R) return;
  var BY = {}; R.D.entries.forEach(function (e) { BY[e.id] = e; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function text(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); }
  function codeOf(e) { var m = e.h.match(/<figure class="code"[^>]*><pre>([\s\S]*?)<\/pre>/); if (!m) return ''; var d = document.createElement('div'); d.innerHTML = m[1]; return d.textContent; }

  var FACE = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 4h24v32l-12-7-12 7z" fill="currentColor"/><g class="eyes"><rect x="13" y="12" width="4" height="7" fill="var(--paper)"/><rect x="23" y="12" width="4" height="7" fill="var(--paper)"/></g><path d="M14 23q6 5 12 0" stroke="var(--paper)" stroke-width="2.2" fill="none"/></svg>';
  var fab = document.createElement('button'); fab.className = 'pip-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Ask Pip'); fab.title = 'Ask Pip'; fab.innerHTML = FACE;
  var box = document.createElement('section'); box.className = 'pip'; box.setAttribute('aria-label', 'Pip'); box.hidden = true;
  box.innerHTML = '<header><span class="pf">' + FACE + '</span><b>Pip</b><button type="button" class="px" aria-label="Close">&times;</button></header>' +
    '<div class="pl" role="log" aria-live="polite"></div>' +
    '<form class="pf2"><label class="vh" for="pq">Ask Pip</label><textarea id="pq" rows="1" enterkeyhint="send" spellcheck="false" placeholder="Ask, or paste an error"></textarea><button type="submit" aria-label="Send"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></button></form>';
  document.body.appendChild(fab); document.body.appendChild(box);
  var log = $('.pl', box), ta = $('textarea', box), form = $('form', box), hist = [], busy = false, off = false;

  function render(t) {
    var h = esc(t).replace(/```(?:\w+)?\n?([\s\S]*?)```/g, function (_, c) { return '<pre>' + c.replace(/\n$/, '') + '</pre>'; })
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\[\[([\w.-]+)\]\]/g, function (_, id) { return BY[id] ? '<a class="ref" href="#/a/' + id + '">' + BY[id].qh + '</a>' : ''; })
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    return h.split(/(<pre>[\s\S]*?<\/pre>)/).map(function (p) { return /^<pre>/.test(p) ? p : p.split(/\n{2,}/).map(function (x) { return x.trim() ? '<p>' + x.trim().replace(/\n/g, '<br>') + '</p>' : ''; }).join(''); }).join('');
  }
  function say(who, html) { var d = document.createElement('div'); d.className = 'm ' + who; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function open(on) {
    box.hidden = !on; fab.classList.toggle('on', on); document.body.classList.toggle('pip-open', on);
    if (on) { if (!log.children.length) say('b', '<p>Hi, I’m Pip. Paste an error or ask anything about Python or tkinter. I can open entries, read and fix your code, and run it.</p>'); setTimeout(function () { ta.focus(); }, 30); }
  }
  fab.onclick = function () { open(box.hidden); };
  window.__pip = { ask: function (t) { open(true); ta.value = t; ta.dispatchEvent(new Event('input')); } };
  $('.px', box).onclick = function () { open(false); fab.focus(); };
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !box.hidden) open(false); });
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'; });
  ta.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); form.requestSubmit(); } });

  function context(q) {
    var ids = [], out = [], m = location.hash.match(/^#\/a\/(.+)$/), cur = m && decodeURIComponent(m[1]);
    if (cur && BY[cur]) ids.push(cur);
    R.search(q).list.slice(0, 4).forEach(function (x) { if (ids.indexOf(x.e.id) < 0) ids.push(x.e.id); });
    ids.slice(0, 5).forEach(function (id) { var e = BY[id]; out.push({ id: id, q: e.q, a: e.aPlain || text(e.a), code: codeOf(e) }); });
    return out;
  }
  /* ---------- hands: tools Pip can use on the page ---------- */
  var ide = function () { return window.__ide; };
  function clipT(t, n) { t = String(t == null ? '' : t); return t.length > n ? t.slice(0, n) + '\n…(cut)' : t; }
  function numbered(c) { return c.split('\n').map(function (l, i) { return (i + 1) + '  ' + l; }).join('\n'); }
  function entryText(e) { return e.q + '\n' + (e.aPlain || text(e.a)) + (codeOf(e) ? '\n\nCode:\n' + codeOf(e) : ''); }
  var undo = null;
  var TOOLSET = {
    search_book: { v: 'Searched the book', d: function (a) { return '“' + clipT(a.query, 60) + '”'; }, f: function (a) {
      var l = R.search(String(a.query || '')).list.slice(0, 5); if (!l.length) return 'No entries matched.';
      return l.map(function (x) { return '[[' + x.e.id + ']] ' + x.e.q + ' — ' + clipT(x.e.aPlain || text(x.e.a), 220); }).join('\n');
    } },
    open_entry: { v: 'Opened an entry', d: function (a) { var e = BY[a.id]; return e ? e.qh : ''; }, f: function (a) {
      var e = BY[String(a.id)]; if (!e) throw new Error('No entry with that id. Use search_book first.');
      location.hash = '#/a/' + e.id; return clipT(entryText(e), 2200);
    } },
    read_editor: { v: 'Read the editor', d: function () { return ''; }, f: function () {
      return ide().ensure().then(function () {
        var s = ide().state(), c = ide().getCode();
        return 'Python ' + (s.ready ? 'is ready' : 'is still loading') + (s.busy ? '; a program is running' : '') + '. ' + s.lines + ' lines.\n' + clipT(numbered(c), 2800) + '\n\nLatest shell output:\n' + (clipT(ide().shellTail(900), 900) || '(none yet)');
      });
    } },
    read_shell: { v: 'Read the shell', d: function () { return ''; }, f: function () {
      return ide().ensure().then(function () { return clipT(ide().shellTail(2500), 2500) || '(the shell is empty)'; });
    } },
    write_editor: { v: 'Wrote to the editor', d: function (a) { return String(a.code || '').split('\n').length + ' lines'; }, f: function (a) {
      if (typeof a.code !== 'string' || !a.code.trim()) throw new Error('code must be a non-empty string');
      return ide().ensure().then(function () { undo = ide().setCode(a.code.replace(/\s+$/, '') + '\n'); return 'Editor now holds the new code (' + a.code.split('\n').length + ' lines).'; });
    }, undo: true },
    run_code: { v: 'Ran the editor’s code', d: function () { return ''; }, f: function () {
      return ide().run().then(function (r) {
        var o = clipT(ide().shellTail(2500), 2500).replace(/^[\s\S]*?=== RESTART: editor ===\n?/, '');
        return (r.skipped ? 'Not run: ' + r.skipped + '.\n' : r.timeout ? 'Still running after 25 seconds (probably waiting for input or looping); stopped waiting.\n' : '') + (o.trim() ? o : '(no output)');
      });
    } },
    run_line: { v: 'Typed in the shell', d: function (a) { return clipT(a.line, 60); }, f: function (a) {
      if (typeof a.line !== 'string' || !a.line.trim()) throw new Error('line must be a string');
      return ide().send(a.line).then(function (r) { return (r.skipped ? 'Not run: ' + r.skipped + '.\n' : r.timeout ? 'No answer yet.\n' : '') + (clipT(ide().shellTail(1800), 1800) || '(no output)'); });
    } },
    list_modules: { v: 'Looked through the modules', d: function (a) { return a.filter ? '“' + clipT(a.filter, 30) + '”' : ''; }, f: function (a) {
      return ide().ensure().then(function () {
        var l = ide().modules(String(a.filter || ''), !!a.addons); if (!l.length) return 'No modules match.';
        return l.length + ' match' + (l.length === 1 ? '' : 'es') + ':\n' + l.slice(0, 80).map(function (m) { return m.name + ' — ' + m.status + (m.note ? ' (' + m.note + ')' : ''); }).join('\n') + (l.length > 80 ? '\n…' : '');
      });
    } },
    peek_module: { v: 'Looked inside a module', d: function (a) { return clipT(a.name, 40); }, f: function (a) {
      var n = String(a.name || '').replace(/[^\w.]/g, ''); if (!n) throw new Error('name is needed');
      return ide().peek(n).then(function (i) { if (!i || i.none) return n + ' can’t be opened here.'; return (i.doc || '(no description)') + '\nNames: ' + i.names.join(', ') + (i.file ? '\nFile: ' + i.file : ''); });
    } },
    open_page: { v: 'Switched page', d: function (a) { return a.page === 'home' ? 'home' : 'editor'; }, f: function (a) {
      if (a.page === 'home') { location.hash = '#/'; return 'On the home page.'; }
      return ide().ensure().then(function () { return 'The editor is open.'; });
    } }
  };
  function stepRow(name, a) {
    var T = TOOLSET[name], d = document.createElement('div'); d.className = 'm s run';
    d.innerHTML = '<i></i><span><b>' + esc(T.v) + '</b> ' + esc(T.d(a) || '') + '</span>'; log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function parseAct(t) {
    var i = t.search(/ACTION\s*\{/); if (i < 0) return null;
    var j = t.indexOf('{', i), depth = 0, k, inS = false, esc2 = false;
    for (k = j; k < t.length; k++) { var c = t[k]; if (inS) { if (esc2) esc2 = false; else if (c === '\\') esc2 = true; else if (c === '"') inS = false; } else if (c === '"') inS = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) break; }
    if (depth) return null;
    try { var o = JSON.parse(t.slice(j, k + 1)); if (o && TOOLSET[o.tool]) return { tool: o.tool, args: (o.args && typeof o.args === 'object') ? o.args : {}, pre: t.slice(0, i).trim() }; } catch (_) {}
    return null;
  }
  function useTool(act, row) {
    var T = TOOLSET[act.tool];
    return new Promise(function (ok) { ok(T.f(act.args)); }).then(function (r) { row.className = 'm s ok'; return String(r); }, function (e) { row.className = 'm s bad'; return 'Failed: ' + (e && e.message || e); });
  }

  function post(body) {
    /* a phone suspends or kills the request when the tab or Safari goes to the background: wait until the page is visible again, then ask once more (up to 3 tries) */
    var hid = false; function seen() { if (document.hidden) hid = true; }
    document.addEventListener('visibilitychange', seen);
    function visible() { return document.hidden ? new Promise(function (ok) { function f() { if (!document.hidden) { document.removeEventListener('visibilitychange', f); setTimeout(ok, 300); } } document.addEventListener('visibilitychange', f); }) : Promise.resolve(); }
    function go(left) {
      hid = document.hidden;
      return fetch('/api/buddy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .catch(function () { return { s: 0, j: {} }; })
        .then(function (x) {
          if ((x.j && x.j.text) || x.s === 429 || left < 1) return x;
          if (!x.s || hid || document.hidden) return visible().then(function () { return go(left - 1); });
          return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return go(left - 1); });
        });
    }
    return go(2).then(function (x) { document.removeEventListener('visibilitychange', seen); return x; }, function (e) { document.removeEventListener('visibilitychange', seen); throw e; });
  }
  function fail(wait, x, q, ctx) {
    wait.className = 'm b err';
    if (x && x.s === 429) wait.innerHTML = '<p>One moment, then ask again.</p>';
    else wait.innerHTML = '<p>Pip can’t answer right now.</p>' + (ctx.length ? '<p><a class="ref" href="#/q/' + encodeURIComponent(q.slice(0, 200)) + '">Search the book instead</a></p>' : '');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var q = ta.value.trim(); if (!q || busy) return;
    ta.value = ''; ta.style.height = 'auto';
    say('u', '<p>' + esc(q).replace(/\n/g, '<br>') + '</p>');
    busy = true; box.classList.add('busy');
    var ctx = context(q), turn = [{ r: 'u', t: q }], steps = 0, acted = false, wait;
    function ask() {
      wait = say('b wait', '<i></i><i></i><i></i>');
      var h = hist.concat(turn.slice(0, -1)), last = turn[turn.length - 1];
      return post({ agent: 1, q: last.t, ctx: ctx, hist: h.slice(-22) }).then(function (x) {
        if (!(x.j && x.j.text)) { fail(wait, x, q, ctx); return false; }
        var t = x.j.text, act = steps < 8 ? parseAct(t) : null;
        if (!act) { turn.push({ r: 'b', t: t.replace(/ACTION\s*\{[\s\S]*$/, '').trim() || t }); wait.className = 'm b'; wait.innerHTML = render(turn[turn.length - 1].t); return true; }
        steps++; acted = true; box.classList.add('act');
        if (act.pre) { wait.className = 'm b'; wait.innerHTML = render(act.pre); } else wait.remove();
        var row = stepRow(act.tool, act.args);
        turn.push({ r: 'b', t: (act.pre ? act.pre + '\n' : '') + 'ACTION ' + JSON.stringify({ tool: act.tool, args: act.args }) });
        return useTool(act, row).then(function (res) {
          if (TOOLSET[act.tool].undo && undo !== null && row.className === 'm s ok') {
            var u = document.createElement('button'); u.type = 'button'; u.className = 'undo'; u.textContent = 'Undo'; var was = undo;
            u.onclick = function () { if (ide()) { ide().setCode(was); u.remove(); } }; row.appendChild(u);
          }
          log.scrollTop = log.scrollHeight;
          turn.push({ r: 'u', t: 'RESULT ' + act.tool + (steps >= 8 ? ' (no more actions allowed; give your answer now)' : '') + ':\n' + clipT(res, 2600) });
          return ask();
        });
      });
    }
    ask().then(function (okay) { if (okay) hist = hist.concat(turn.filter(function (m) { return m.t; })).slice(-24); })
      .catch(function () { if (wait) fail(wait, null, q, ctx); })
      .then(function () { busy = false; box.classList.remove('busy', 'act'); log.scrollTop = log.scrollHeight; });
  });
  log.addEventListener('click', function (ev) { if (ev.target.closest('a.ref') && matchMedia('(max-width:620px)').matches) open(false); });
})();
