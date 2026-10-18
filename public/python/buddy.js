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
    if (on) { if (!log.children.length) say('b', '<p>Hi, I’m Pip. Paste an error or ask anything about Python or tkinter.</p>'); setTimeout(function () { ta.focus(); }, 30); }
  }
  fab.onclick = function () { open(box.hidden); };
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
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var q = ta.value.trim(); if (!q || busy) return;
    ta.value = ''; ta.style.height = 'auto';
    say('u', '<p>' + esc(q).replace(/\n/g, '<br>') + '</p>');
    var wait = say('b wait', '<i></i><i></i><i></i>'); busy = true; box.classList.add('busy');
    var body = { q: q, ctx: context(q), hist: hist.slice(-6) };
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
    go(2)
      .then(function (x) {
        if (x.j && x.j.text) { hist.push({ r: 'u', t: q }, { r: 'b', t: x.j.text }); wait.className = 'm b'; wait.innerHTML = render(x.j.text); }
        else if (x.s === 429) { wait.className = 'm b err'; wait.innerHTML = '<p>One moment, then ask again.</p>'; }
        else { wait.className = 'm b err'; wait.innerHTML = '<p>Pip can’t answer right now.</p>' + (body.ctx.length ? '<p><a class="ref" href="#/q/' + encodeURIComponent(q.slice(0, 200)) + '">Search the book instead</a></p>' : ''); }
      })
      .catch(function () { wait.className = 'm b err'; wait.innerHTML = '<p>Pip can’t answer right now.</p>'; })
      .then(function () { document.removeEventListener('visibilitychange', seen); busy = false; box.classList.remove('busy'); log.scrollTop = log.scrollHeight; });
  });
  log.addEventListener('click', function (ev) { if (ev.target.closest('a.ref') && matchMedia('(max-width:620px)').matches) open(false); });
})();
