/* Python Answer Book: browse + search over window.PYREF (built by tools/pyref/build.py). */
(function () {
  'use strict';
  var D = window.PYREF || { sections: [], entries: [] };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var main = $('#main'), rail = $('#rail'), q = $('#q');
  var SEC = {}, BY = {}, ORDER = {};
  var groups = { tkinter: [], python: [] };
  D.sections.forEach(function (s, i) {
    SEC[s.id] = s; s.items = [];
    (groups[s.group] || (groups[s.group] = [])).push(s);
    s.no = (s.group === 'tkinter' ? 'T' : 'P') + groups[s.group].length;
  });
  D.entries.forEach(function (e, i) { BY[e.id] = e; e.i = i; SEC[e.s].items.push(e); });
  D.sections.forEach(function (s) { s.items.forEach(function (e, k) { ORDER[e.id] = k; }); });

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (_) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function strip(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }

  // ------------------------------------------------------------ theme
  var th = store('pyrefTheme');
  if (th) document.documentElement.setAttribute('data-theme', th);
  $('#themeBtn').onclick = function () {
    var dark = document.documentElement.getAttribute('data-theme') ? document.documentElement.getAttribute('data-theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store('pyrefTheme', next);
  };

  // ------------------------------------------------------------ search index
  var STOP = {};
  'a an and are as at be by can could do does did doing for from has have how i if in into is it its me my of on or should so that the their them then there this to too use using want was way we what when where which why will with would you your get got make making made'.split(' ').forEach(function (w) { STOP[w] = 1; });
  var KEEP = { get: 1, set: 1, make: 0, use: 0 };
  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ies$/.test(w)) w = w.slice(0, -3) + 'y';
    else if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /[^s]s$/.test(w)) w = w.slice(0, -1);
    else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
    return w;
  }
  function words(s, keepStop) {
    var out = [];
    String(s).toLowerCase().replace(/[a-z_][a-z0-9_]*|\d+/g, function (w) {
      if (!keepStop && STOP[w] && !KEEP[w]) return;
      out.push(stem(w));
      if (w.indexOf('_') > 0) w.split('_').forEach(function (p) { if (p.length > 2) out.push(stem(p)); });
    });
    return out;
  }
  var SYN = {
    gui: ['tkinter', 'window'], tk: ['tkinter'], tkinter: ['tk'], textbox: ['entry', 'text'], input: ['entry'], inputbox: ['entry'], field: ['entry'],
    dropdown: ['combobox', 'optionmenu'], drop: ['combobox'], select: ['combobox', 'listbox'], popup: ['messagebox', 'toplevel'], alert: ['messagebox'],
    dialog: ['messagebox', 'filedialog', 'toplevel'], table: ['treeview', 'grid'], spreadsheet: ['treeview'], tab: ['notebook'], timer: ['after'], delay: ['after', 'sleep'],
    wait: ['after', 'sleep'], schedule: ['after'], loop: ['after', 'for', 'while'], freeze: ['respond', 'thread', 'after'], frozen: ['respond', 'thread'], hang: ['respond', 'thread'],
    lag: ['respond', 'thread'], picture: ['image', 'photoimage'], photo: ['image', 'photoimage'], img: ['image'], jpg: ['pillow', 'image'], jpeg: ['pillow', 'image'], png: ['image', 'photoimage'],
    colour: ['color'], color: ['colour'], background: ['bg'], bg: ['background'], foreground: ['fg'], font: ['font'], size: ['geometry', 'size'], position: ['place', 'geometry'],
    click: ['command', 'bind', 'button'], press: ['bind', 'command'], key: ['bind', 'keyboard'], keyboard: ['bind', 'key'], shortcut: ['bind', 'accelerator'], hotkey: ['bind'],
    checkbox: ['checkbutton'], tickbox: ['checkbutton'], radio: ['radiobutton'], slider: ['scale'], scroll: ['scrollbar'], list: ['listbox', 'list'], menu: ['menu', 'menubar'],
    layout: ['pack', 'grid', 'place'], align: ['anchor', 'sticky', 'justify'], center: ['centre', 'anchor'], centre: ['center'], close: ['destroy', 'quit'], exit: ['destroy', 'quit', 'exit'],
    hide: ['withdraw', 'forget'], remove: ['destroy', 'forget', 'delete', 'remove'], clear: ['delete', 'clear'], refresh: ['update', 'config'], update: ['config', 'update'], change: ['config', 'configure'],
    edit: ['config'], disable: ['state', 'disabled'], grey: ['disabled'], gray: ['disabled'], readonly: ['state', 'readonly'], password: ['show'], placeholder: ['placeholder', 'hint'],
    draw: ['canvas'], shape: ['canvas'], line: ['canvas', 'line'], animate: ['after', 'canvas'], animation: ['after', 'canvas', 'move'], game: ['canvas', 'after'],
    file: ['open', 'file', 'filedialog'], save: ['write', 'save', 'asksaveasfilename'], browse: ['filedialog'], folder: ['directory', 'askdirectory'], thread: ['threading'], threading: ['thread'],
    variable: ['stringvar', 'intvar', 'variable'], var: ['stringvar', 'variable'], array: ['list'], dictionary: ['dict'], dict: ['dictionary'], hashmap: ['dict'], text: ['text', 'string', 'str'],
    string: ['str'], str: ['string'], number: ['int', 'float'], integer: ['int'], decimal: ['float', 'round'], convert: ['int', 'str', 'float'], random: ['random'], csv: ['csv'],
    function: ['def', 'function'], method: ['def', 'class'], object: ['class'], oop: ['class'], error: ['error', 'exception'], exception: ['error', 'try'], crash: ['error', 'try'], bug: ['error'],
    sleep: ['after', 'sleep'], pause: ['sleep', 'after'], round: ['round'], format: ['format', 'f'], fstring: ['f'], length: ['len'], count: ['len', 'count'], sort: ['sort', 'sorted'],
    install: ['pip', 'install'], package: ['pip', 'module'], library: ['module', 'pip'], module: ['import'], exe: ['pyinstaller'], executable: ['pyinstaller'], app: ['pyinstaller', 'window'],
    sound: ['winsound', 'audio'], music: ['audio'], screenshot: ['image', 'pillow'], dark: ['theme', 'color'], theme: ['ttk', 'style'], style: ['ttk', 'style'], pretty: ['ttk', 'style'], modern: ['ttk']
  };
  var INV = {}, VOCAB = [];
  function addTok(t, i, w) { var m = INV[t] || (INV[t] = {}); m[i] = Math.max(m[i] || 0, w) + (m[i] ? 0.15 : 0); }
  D.entries.forEach(function (e, i) {
    e.aPlain = strip(e.a);
    var sec = SEC[e.s];
    words(e.q).forEach(function (t) { addTok(t, i, 9); });
    words(e.aka.replace(/,/g, ' ')).forEach(function (t) { addTok(t, i, 7); });
    words(e.err).forEach(function (t) { addTok(t, i, 6); });
    words(e.aPlain).forEach(function (t) { addTok(t, i, 3); });
    words(sec.title + ' ' + sec.group).forEach(function (t) { addTok(t, i, 1.5); });
    words(e.t).forEach(function (t) { addTok(t, i, 1); });
    e.hay = (e.q + ' | ' + e.aka + ' | ' + e.err).toLowerCase();
    e.errs = e.err ? e.err.split('|').map(function (p) { return p.trim().toLowerCase(); }) : [];
  });
  VOCAB = Object.keys(INV).sort();

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function lookup(t, last) {
    // returns {entryIdx: weight} for a query token, using exact, prefix and fuzzy matches
    var hits = {}, found = false;
    function merge(m, f) { for (var k in m) { var v = m[k] * f; if (!hits[k] || hits[k] < v) hits[k] = v; } found = true; }
    if (INV[t]) merge(INV[t], 1);
    (SYN[t] || []).forEach(function (s) { s = stem(s); if (INV[s]) merge(INV[s], 0.55); });
    if (t.length >= 3) {
      var lo = 0, hi = VOCAB.length;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (VOCAB[mid] < t) lo = mid + 1; else hi = mid; }
      for (var k = lo, n = 0; k < VOCAB.length && VOCAB[k].indexOf(t) === 0 && n < 40; k++, n++) if (VOCAB[k] !== t) merge(INV[VOCAB[k]], last ? 0.75 : 0.45);
    }
    if (!INV[t] && t.length >= 4) {
      var max = t.length >= 7 ? 2 : 1, fz = [];
      for (var v = 0; v < VOCAB.length; v++) { var d = lev(t, VOCAB[v], max); if (d <= max) fz.push([VOCAB[v], d]); }
      fz.sort(function (a, b) { return a[1] - b[1]; }).slice(0, 6).forEach(function (p) { merge(INV[p[0]], p[1] === 1 ? 0.6 : 0.4); typo.push(p[0]); });
    }
    return found ? hits : null;
  }
  var typo = [];

  function errorLine(s) {
    var lines = s.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    for (var i = lines.length - 1; i >= 0; i--) if (/^(?:[\w.]+\.)?(\w*(?:Error|Exception|Warning)|TclError|KeyboardInterrupt|StopIteration)\b/.test(lines[i])) return lines[i];
    var m = s.match(/((?:_tkinter\.)?\w*(?:Error|Exception)\b:?[^\n]*)/);
    return m ? m[1].trim() : '';
  }
  function patMatch(pat, line) {
    var parts = pat.split('*'), pos = 0;
    for (var i = 0; i < parts.length; i++) { var p = parts[i].trim(); if (!p) continue; var k = line.indexOf(p, pos); if (k < 0) return false; pos = k + p.length; }
    return true;
  }
  function search(raw) {
    typo = [];
    var s = raw.trim(); if (!s) return { list: [] };
    var eline = errorLine(s), el = eline.toLowerCase();
    var body = eline ? eline.replace(/'[^']*'|"[^"]*"/g, ' ') : s;
    var toks = words(body), toksAll = words(body, true);
    if (!toks.length) toks = toksAll;
    var score = {}, matched = {};
    toks.forEach(function (t, k) {
      var h = lookup(t, k === toks.length - 1 && !/\s$/.test(raw));
      if (!h) return;
      for (var i in h) { score[i] = (score[i] || 0) + h[i]; matched[i] = (matched[i] || 0) + 1; }
    });
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    D.entries.forEach(function (e, i) {
      var bonus = 0;
      if (el) e.errs.forEach(function (p) { if (patMatch(p, el)) bonus = Math.max(bonus, 40 + p.length / 3); });
      if (low.length > 3 && e.hay.indexOf(low) >= 0) bonus += 14;
      if (bonus) { score[i] = (score[i] || 0) + bonus; matched[i] = Math.max(matched[i] || 0, toks.length); }
    });
    var n = Math.max(1, toks.length), list = [];
    for (var i in score) {
      var cov = Math.min(1, (matched[i] || 0) / n);
      list.push({ e: D.entries[i], sc: score[i] * (0.25 + 0.75 * cov * cov) });
    }
    list.sort(function (a, b) { return b.sc - a.sc; });
    var top = list.length ? list[0].sc : 0;
    list = list.filter(function (r) { return r.sc >= top * 0.18 && r.sc > 1.2; }).slice(0, 40);
    return { list: list, eline: eline, toks: toksAll, typo: typo.slice() };
  }
  function mark(text, toks) {
    var h = esc(text);
    if (!toks.length) return h;
    var re = new RegExp('\\b(' + toks.filter(function (t) { return t.length > 1; }).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\w*', 'gi');
    return h.replace(re, '<mark>$&</mark>');
  }

  // ------------------------------------------------------------ rail
  function buildRail(cur, curEntry) {
    var h = '';
    ['tkinter', 'python'].forEach(function (g) {
      h += '<h4>' + (g === 'tkinter' ? 'tkinter' : 'Python') + '</h4>';
      groups[g].forEach(function (s) {
        var on = s.id === cur;
        h += '<a href="#/s/' + s.id + '" class="' + (on ? 'on' : '') + '"><span class="no">' + s.no + '</span><span>' + esc(s.title) + '</span><span class="ct">' + s.items.length + '</span></a>';
        if (on && curEntry) {
          h += '<ol>' + s.items.map(function (e) { return '<li><a href="#/a/' + e.id + '" class="' + (e.id === curEntry ? 'on' : '') + '">' + e.qh + '</a></li>'; }).join('') + '</ol>';
        }
      });
    });
    rail.innerHTML = h;
    var on = rail.querySelector('ol a.on') || rail.querySelector('a.on');
    if (on && on.scrollIntoView && !document.body.classList.contains('idx')) {
      var r = on.getBoundingClientRect(), rr = rail.getBoundingClientRect();
      if (r.top < rr.top || r.bottom > rr.bottom) rail.scrollTop += r.top - rr.top - rr.height / 3;
    }
  }

  // ------------------------------------------------------------ views
  function home() {
    document.title = 'Python Answer Book';
    var nCode = D.entries.reduce(function (a, e) { return a + (e.h.match(/<figure class="code(?! out| sh)/g) || []).length; }, 0);
    var h = '<p class="lede"><span><b>' + D.entries.length + '</b> answers</span><span><b>' + D.sections.length + '</b> sections</span><span><b>' + nCode + '</b> examples, each one run before publishing</span></p>';
    var errs = D.entries.filter(function (e) { return e.err; });
    if (errs.length) {
      h += '<section class="errs"><h2>Error messages</h2><ul>' + errs.map(function (e) {
        var first = e.err.split('|')[0].replace(/\*/g, '…').trim();
        return '<li><a href="#/a/' + e.id + '" title="' + esc(e.q) + '">' + esc(first.length > 46 ? first.slice(0, 44) + '…' : first) + '</a></li>';
      }).join('') + '</ul></section>';
    }
    var seen = (store('pyrefSeen') || []).filter(function (id) { return BY[id]; }).slice(0, 6);
    if (seen.length) h += '<section class="recent"><h2 class="lab">Opened recently</h2><ol>' + seen.map(function (id) { return '<li><a href="#/a/' + id + '">' + esc(BY[id].q) + '</a></li>'; }).join('') + '</ol></section>';
    ['tkinter', 'python'].forEach(function (g) {
      if (!groups[g] || !groups[g].length) return;
      var n = groups[g].reduce(function (a, s) { return a + s.items.length; }, 0);
      h += '<section class="group ' + (g === 'python' ? 'py' : 'tk') + '"><h2><span>' + (g === 'tkinter' ? 'tkinter' : 'Python') + '</span>' + n + ' answers</h2><div class="secs">';
      groups[g].forEach(function (s) {
        var show = g === 'tkinter' ? 5 : 4;
        h += '<div class="sec"><h3><span class="no">' + s.no + '</span><a href="#/s/' + s.id + '">' + esc(s.title) + '</a></h3><p>' + esc(s.blurb) + '</p><ul>' +
          s.items.slice(0, show).map(function (e) { return '<li><a href="#/a/' + e.id + '">' + e.qh + '</a></li>'; }).join('') + '</ul>' +
          (s.items.length > show ? '<a class="more" href="#/s/' + s.id + '">All ' + s.items.length + '</a>' : '') + '</div>';
      });
      h += '</div></section>';
    });
    main.innerHTML = h;
    buildRail(null);
  }
  function section(id) {
    var s = SEC[id]; if (!s) return home();
    document.title = s.title + ' · Python Answer Book';
    main.innerHTML = '<p class="crumb"><a href="#/">Index</a><span>' + s.no + ' · ' + (s.group === 'tkinter' ? 'tkinter' : 'Python') + '</span></p><h1>' + esc(s.title) + '</h1><ol class="qlist">' +
      s.items.map(function (e) { return '<li><a href="#/a/' + e.id + '"><span class="qq">' + e.qh + '</span><span class="qa">' + esc(e.aPlain) + '</span></a></li>'; }).join('') + '</ol>';
    buildRail(id);
  }
  function entry(id) {
    var e = BY[id]; if (!e) return home();
    var s = SEC[e.s], k = ORDER[id], prev = s.items[k - 1], next = s.items[k + 1];
    document.title = e.q + ' · Python Answer Book';
    var h = '<p class="crumb"><a href="#/s/' + s.id + '">' + s.no + ' · ' + esc(s.title) + '</a><span>' + (k + 1) + ' of ' + s.items.length + '</span></p>' +
      '<h1>' + e.qh + '</h1><div class="ans">' + e.a + '</div><div class="body">' + e.h + '</div>';
    if (e.see.length) h += '<section class="see"><h2>See also</h2><ul>' + e.see.filter(function (x) { return BY[x]; }).map(function (x) { return '<li><a href="#/a/' + x + '">' + BY[x].qh + '</a></li>'; }).join('') + '</ul></section>';
    h += '<nav class="pn">' + (prev ? '<a href="#/a/' + prev.id + '"><small>Previous</small>' + prev.qh + '</a>' : '') + (next ? '<a class="nx" href="#/a/' + next.id + '"><small>Next</small>' + next.qh + '</a>' : '') + '</nav>';
    main.innerHTML = h;
    main.querySelectorAll('.code:not(.out)').forEach(function (f) {
      var b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy';
      b.onclick = function () {
        var txt = f.querySelector('pre').textContent;
        var done = function () { b.textContent = 'Copied'; b.classList.remove('done'); void b.offsetWidth; b.classList.add('done'); setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
        else { fallbackCopy(txt); done(); }
      };
      f.appendChild(b);
    });
    var seen = (store('pyrefSeen') || []).filter(function (x) { return x !== id; }); seen.unshift(id); store('pyrefSeen', seen.slice(0, 12));
    buildRail(s.id, id);
  }
  function fallbackCopy(t) { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (_) {} a.remove(); }

  var sel = -1, lastRes = null;
  function results(raw) {
    var r = search(raw); lastRes = r; sel = r.list.length ? 0 : -1;
    document.title = raw + ' · Python Answer Book';
    var h = '';
    if (r.eline) h += '<div class="errline">' + esc(r.eline) + '</div>';
    if (r.list.length) {
      h += '<p class="rhead"><span>' + r.list.length + (r.list.length === 40 ? '+' : '') + ' answers</span>' + (r.typo.length ? '<span>also matched: ' + esc(r.typo.slice(0, 3).join(', ')) + '</span>' : '') + '</p><ol class="res">' +
        r.list.map(function (x, i) {
          var s = SEC[x.e.s];
          return '<li><a href="#/a/' + x.e.id + '" class="' + (i === 0 ? 'sel' : '') + '"><span class="rq">' + mark(x.e.q, r.toks) + '</span><span class="rs">' + s.no + ' · ' + esc(s.title) + '</span><span class="ra">' + mark(x.e.aPlain, r.toks) + '</span></a></li>';
        }).join('') + '</ol>';
    } else {
      h += '<div class="none"><h1>Nothing in the book for that yet.</h1><p>Try fewer or different words (e.g. <code>button colour</code>, <code>entry get</code>), or paste just the last line of the error.</p></div>';
    }
    var enc = encodeURIComponent(raw.slice(0, 200));
    h += '<section class="see"><h2>Look further</h2><ul class="ext">' +
      '<li><a target="_blank" rel="noopener" href="https://docs.python.org/3/search.html?q=' + enc + '">Search the official Python docs</a></li>' +
      '<li><a target="_blank" rel="noopener" href="https://stackoverflow.com/search?q=' + encodeURIComponent((/tk|tkinter|widget|window|button|label|entry|canvas/i.test(raw) ? '[tkinter] ' : '[python] ') + raw.slice(0, 160)) + '">Search Stack Overflow</a></li>' +
      '<li><a target="_blank" rel="noopener" href="https://tkdocs.com/shipman/index-2.html">tkinter reference (Shipman, at tkdocs.com)</a></li></ul></section>';
    main.innerHTML = h;
    buildRail(null);
  }
  function moveSel(d) {
    var as = main.querySelectorAll('.res a'); if (!as.length) return;
    if (sel >= 0 && as[sel]) as[sel].classList.remove('sel');
    sel = (sel + d + as.length) % as.length; as[sel].classList.add('sel');
    var r = as[sel].getBoundingClientRect(), top = $('.top').getBoundingClientRect().bottom;
    if (r.top < top || r.bottom > innerHeight) scrollBy(0, r.top - top - 80);
  }

  // ------------------------------------------------------------ routing
  var typing = false;
  function route() {
    document.body.classList.remove('idx');
    var h = decodeURIComponent(location.hash.slice(1) || '/'), m;
    if ((m = h.match(/^\/a\/(.+)$/))) entry(m[1]);
    else if ((m = h.match(/^\/s\/(.+)$/))) section(m[1]);
    else if ((m = h.match(/^\/q\/([\s\S]*)$/))) { if (!typing) q.value = m[1]; results(m[1]); }
    else home();
    if (!typing) { if (!/^\/q\//.test(h)) q.value = ''; scrollTo(0, 0); }
    typing = false;
  }
  var tmr;
  q.addEventListener('input', function () {
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      var v = q.value;
      typing = true;
      if (!v.trim()) { typing = false; if (/^#\/q\//.test(location.hash)) history.back(); return; }
      var nh = '#/q/' + encodeURIComponent(v);
      if (/^#\/q\//.test(location.hash)) history.replaceState(null, '', nh); else history.pushState(null, '', nh);
      route();
    }, 120);
  });
  q.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); moveSel(1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); moveSel(-1); }
    else if (ev.key === 'Escape') { q.value = ''; q.blur(); location.hash = '#/'; }
  });
  $('#find').addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearTimeout(tmr);
    if (!q.value.trim()) return;
    if (!lastRes || !/^#\/q\//.test(location.hash)) { typing = true; history.pushState(null, '', '#/q/' + encodeURIComponent(q.value)); route(); }
    var as = main.querySelectorAll('.res a'); var a = as[Math.max(0, sel)];
    if (a) { q.blur(); location.hash = a.getAttribute('href'); }
  });
  q.addEventListener('paste', function () { setTimeout(function () { q.dispatchEvent(new Event('input')); }, 0); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === '/' && document.activeElement !== q && !/input|textarea/i.test(document.activeElement.tagName)) { ev.preventDefault(); q.focus(); q.select(); }
    if (ev.key === 'Escape') document.body.classList.remove('idx');
  });
  $('#idxBtn').onclick = function () { buildRail(null); document.body.classList.toggle('idx'); };
  $('#scrim').onclick = function () { document.body.classList.remove('idx'); };
  function hh() { document.documentElement.style.setProperty('--hh', $('.top').offsetHeight + 'px'); }
  addEventListener('resize', hh); hh();
  addEventListener('hashchange', route);
  route();
  window.__pyref = { search: search, D: D };
})();
