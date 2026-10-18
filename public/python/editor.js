/* The Answer Book's editor and shell: real CPython (Pyodide) in a worker, laid out for a phone first. */
(function () {
  'use strict';
  var R = window.__pyref; if (!R) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var main = $('#main');
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_) { return null; } }

  /* what a browser can't give a module; everything else imports and runs (checked with Test all) */
  var NO = {
    tkinter: 'A browser has no window system, so Tk can’t open windows.', _tkinter: 'Needs Tk.', turtle: 'Draws through tkinter, so it can’t open a window.', turtledemo: 'Needs turtle and tkinter.',
    idlelib: 'IDLE is a tkinter program.', curses: 'There is no terminal to draw on.', _curses: 'Needs a terminal.', _curses_panel: 'Needs a terminal.',
    dbm: 'Left out of the browser build.', ensurepip: 'Left out of the browser build.', venv: 'Left out of the browser build.',
    fcntl: 'Unix system calls the browser build leaves out.', grp: 'No user or group database.', pwd: 'No user or group database.', resource: 'No process limits to read.', syslog: 'No system log.', termios: 'There is no terminal.', tty: 'There is no terminal.', pty: 'There is no terminal.', readline: 'No line editing here; the shell keeps its own history.',
    winreg: 'Windows only.', msvcrt: 'Windows only.', _winapi: 'Windows only.', winsound: 'Windows only.', nt: 'Windows only.', _overlapped: 'Windows only.', _wmi: 'Windows only.', _msi: 'Windows only.'
  };
  var LTD = {
    socket: 'Imports, but a page can’t open raw sockets.', _socket: 'No raw sockets.', ssl: 'Imports, but there are no sockets to secure.', select: 'No file descriptors to wait on.', selectors: 'No sockets to wait on.',
    subprocess: 'Imports, but a page can’t start another program.', multiprocessing: 'Imports, but can’t start processes.', threading: 'Imports, but a thread can’t start.', _thread: 'Threads can’t start.',
    concurrent: 'Thread and process pools can’t start workers.', http: 'Needs sockets; use pyodide.http.pyfetch for web requests.', urllib: 'Needs sockets; use pyodide.http.pyfetch for web requests.',
    smtplib: 'Needs sockets.', ftplib: 'Needs sockets.', imaplib: 'Needs sockets.', poplib: 'Needs sockets.', nntplib: 'Needs sockets.', xmlrpc: 'Needs sockets.', socketserver: 'Needs sockets.', asyncio: 'Runs, but without sockets or subprocesses.',
    webbrowser: 'Can’t open the system browser.',
    signal: 'No real signals.', os: 'Works on an in-memory file system; no real processes.',
    mmap: 'Memory-only files.', ctypes: 'No system libraries to load.', pathlib: 'Works on an in-memory file system that resets on reload.', shutil: 'Works on an in-memory file system.', sqlite3: 'Works; the database lives in memory unless saved.', zoneinfo: 'Works; zone data loads on first use.'
  };
  var SKIP = { this: 1, antigravity: 1, __hello__: 1, __phello__: 1, __main__: 1 };
  var KEYS = ['Tab', '(', ')', '[', ']', '{', '}', ':', '"', "'", '=', '_', '#', '.', ',', '+', '-', '*', '/', '%'];
  var PAIR = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
  var SAMPLE = 'name = input("Name? ")\nprint("Hello,", name)\n\nfor n in range(1, 4):\n    print(n, n * n)\n';

  /* ---------- syntax colour ---------- */
  var KW = /^(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)$/;
  var LIT = /^(True|False|None|self|cls)$/;
  var TOK = /(#[^\n]*)|((?:[rbfuRBFU]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*(?:"|$)|'(?:\\.|[^'\\\n])*(?:'|$)))|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b[A-Za-z_]\w*\b)|(@\w[\w.]*)/g;
  function paint(src) {
    var out = '', last = 0, m, prev = '';
    TOK.lastIndex = 0;
    while ((m = TOK.exec(src))) {
      out += esc(src.slice(last, m.index)); last = TOK.lastIndex;
      var t = m[0];
      if (m[1]) out += '<i class="c">' + esc(t) + '</i>';
      else if (m[2]) out += '<i class="s">' + esc(t) + '</i>';
      else if (m[3]) out += '<i class="n">' + esc(t) + '</i>';
      else if (m[5]) out += '<i class="d">' + esc(t) + '</i>';
      else if (KW.test(t)) out += '<i class="k">' + esc(t) + '</i>';
      else if (LIT.test(t)) out += '<i class="l">' + esc(t) + '</i>';
      else if (prev === 'def' || prev === 'class') out += '<i class="f">' + esc(t) + '</i>';
      else out += esc(t);
      if (m[4]) prev = t; else if (!/^\s+$/.test(t)) prev = '';
    }
    return out + esc(src.slice(last));
  }

  /* ---------- state ---------- */
  var root, ta, hl, gut, outEl, prompt, ps, pin, runB, stopB, chip, keysEl, modsEl, listEl, qEl, sheet;
  var worker, ready = false, busy = false, runId = 0, swOK = null, needId = 0, more = false, hist = [], hpos = 0, lastErr = '';
  var info = { mods: [], add: [], bad: {} }, tab = 'ed', which = 'std', showPriv = false, probing = false, probeCb;
  var swTried;

  function sw() {
    if (swTried) return swTried;
    swTried = !('serviceWorker' in navigator) ? Promise.resolve(false) :
      navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; }).then(function () {
        return navigator.serviceWorker.controller ? true : new Promise(function (ok) { navigator.serviceWorker.addEventListener('controllerchange', function () { ok(true); }, { once: true }); setTimeout(function () { ok(!!navigator.serviceWorker.controller); }, 2000); });
      }).catch(function () { return false; });
    return swTried;
  }
  function sendStdin(id, line) {
    var c = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (c) c.postMessage({ stdin: 1, id: id, line: line });
  }

  function spawn() {
    ready = false; setChip('Loading Python…', 'wait'); lock();
    sw().then(function (ok) {
      swOK = ok;
      worker = new Worker('editor-worker.js');
      worker.onmessage = onMsg;
      worker.onerror = function () { setChip('Python couldn’t load', 'bad'); };
    });
  }
  function onMsg(ev) {
    var m = ev.data;
    if (m.t === 'ready') {
      ready = true; info.mods = m.mods; info.add = m.add; setChip('Python ' + m.ver, 'ok'); lock(); if (modsEl) renderMods();
      if (pendingRun) { var p = pendingRun; pendingRun = null; run(); }
    } else if (m.t === 'fail') setChip('Python couldn’t load', 'bad');
    else if (m.t === 'out') { if (!probing) write(m.k, m.s); }
    else if (m.t === 'need') {
      needId = m.id;
      if (!swOK) { sendStdin(m.id, null); return; }
      prompt.hidden = false; ps.textContent = ''; pin.value = ''; prompt.classList.add('stdin'); focusShell();
    } else if (m.t === 'more') { more = true; ps.textContent = '...'; focusShell(); }
    else if (m.t === 'done') {
      busy = false; more = false; prompt.classList.remove('stdin'); needId = 0; ps.textContent = '>>>'; prompt.hidden = false; lock();
      if (lastErr) errBtn();
      focusShell(true);
    } else if (m.t === 'peek') showPeek(m);
    else if (m.t === 'probing') { chip2.textContent = m.n + ' / ' + probeN; }
    else if (m.t === 'probed') { probing = false; info.bad = m.bad; store('pyideBad' + info.mods.length, JSON.stringify(m.bad)); renderMods(); setChip('Python ' + (chip.dataset.ver || ''), 'ok'); chip2.textContent = ''; lock(); }
  }
  var pendingRun, chip2, probeN = 0;

  function setChip(t, k) { if (!chip) return; chip.textContent = t; chip.className = 'chip ' + k; if (/^Python \d/.test(t)) chip.dataset.ver = t.slice(7); }
  function lock() { if (!runB) return; runB.disabled = busy || probing || (!ready && !worker); stopB.disabled = !busy; root.classList.toggle('busy', busy); }

  /* ---------- shell output ---------- */
  function write(k, s) {
    var last = outEl.lastChild;
    if (last && last.dataset.k === k && k !== 'echo') { last.textContent += s; }
    else { var n = document.createElement('span'); n.dataset.k = k; n.className = 'o-' + k; n.textContent = s; outEl.appendChild(n); }
    if (k === 'e') lastErr += s;
    while (outEl.childNodes.length > 600) outEl.removeChild(outEl.firstChild);
    outEl.scrollTop = outEl.scrollHeight;
    var sc = outEl.parentNode; sc.scrollTop = sc.scrollHeight;
  }
  function errBtn() {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ask'; b.textContent = 'Ask Pip about this';
    var err = lastErr.trim().split('\n').slice(-12).join('\n');
    b.onclick = function () { if (window.__pip) window.__pip.ask('My code raised this error:\n' + err + '\n\nWhat does it mean and how do I fix it?'); };
    outEl.appendChild(b); outEl.parentNode.scrollTop = outEl.parentNode.scrollHeight; lastErr = '';
  }
  function focusShell(soft) { if (tab === 'sh' || wide()) { if (soft && document.activeElement === ta) return; pin.focus({ preventScroll: true }); } }
  function wide() { return matchMedia('(min-width:900px)').matches; }

  /* ---------- running ---------- */
  function run() {
    if (busy) return;
    if (!ready) { pendingRun = true; setTab('sh'); return; }
    var code = ta.value; store('pyideCode', code);
    lastErr = ''; busy = true; lock();
    write('banner', (outEl.firstChild ? '\n' : '') + '=== RESTART: editor ===\n');
    if (!wide()) setTab('sh');
    prompt.hidden = true;
    worker.postMessage({ t: 'run', id: ++runId, code: code });
  }
  function stop() {
    if (!busy && !probing) return;
    worker.terminate(); busy = false; probing = false; needId = 0; more = false; write('banner', '\n=== STOPPED ===\n'); prompt.hidden = true; spawn();
  }
  function submit() {
    var line = pin.value;
    if (needId) {
      var id = needId; needId = 0; write('in', line + '\n'); pin.value = ''; prompt.hidden = true; prompt.classList.remove('stdin'); sendStdin(id, line); return;
    }
    if (busy || !ready) return;
    write('echo', (more ? '... ' : '>>> ') + line + '\n');
    if (line.trim()) { hist.push(line); hpos = hist.length; }
    var next = /:\s*$/.test(line) ? '    ' : (more ? (/^(\s*)/.exec(line)[1]) : '');
    pin.value = ''; busy = true; lock(); lastErr = '';
    worker.postMessage({ t: 'line', id: ++runId, line: line });
    pin.value = next; pin.dataset.next = next;
    pin.style.height = 'auto';
  }

  /* ---------- editor behaviour ---------- */
  function ins(text) {
    ta.focus({ preventScroll: true });
    var ok = false; try { ok = document.execCommand('insertText', false, text); } catch (_) {}
    if (!ok) { ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); sync(); }
  }
  function curLine() { var v = ta.value, p = ta.selectionStart, a = v.lastIndexOf('\n', p - 1) + 1; return { a: a, text: v.slice(a, p) }; }
  function enter() {
    var l = curLine(), ind = /^[ \t]*/.exec(l.text)[0];
    if (/[:({\[]\s*$/.test(l.text.replace(/#.*$/, ''))) ind += '    ';
    ins('\n' + ind);
  }
  function tabKey(back) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    if (s === e && !back) { ins('    '); return; }
    var a = v.lastIndexOf('\n', s - 1) + 1, b = e, blk = v.slice(a, b), lines = blk.split('\n');
    lines = lines.map(function (x) { return back ? x.replace(/^( {1,4}|\t)/, '') : '    ' + x; });
    ta.setSelectionRange(a, b);
    var nw = lines.join('\n');
    var ok = false; try { ok = document.execCommand('insertText', false, nw); } catch (_) {}
    if (!ok) ta.setRangeText(nw, a, b, 'end');
    ta.setSelectionRange(a, a + nw.length); sync();
  }
  function key(k) {
    if (k === 'Tab') { tabKey(false); return; }
    if (PAIR[k]) {
      var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
      if (s === e && (k === '"' || k === "'") && ta.value[s] === k) { ta.setSelectionRange(s + 1, s + 1); return; }
      ins(k + sel + PAIR[k]); if (s === e) ta.setSelectionRange(s + 1, s + 1); return;
    }
    if (k === ')' || k === ']' || k === '}') { var p = ta.selectionStart; if (ta.value[p] === k) { ta.setSelectionRange(p + 1, p + 1); return; } }
    ins(k);
  }
  function sync() {
    var v = ta.value;
    hl.innerHTML = paint(v) + '\n';
    var n = v.split('\n').length, g = '';
    if (gut.dataset.n != n) { for (var i = 1; i <= n; i++) g += i + '\n'; gut.firstChild.textContent = g; gut.dataset.n = n; }
    scrollSync();
  }
  function scrollSync() { hl.style.transform = 'translate(' + (-ta.scrollLeft) + 'px,' + (-ta.scrollTop) + 'px)'; gut.firstChild.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)'; }

  /* ---------- modules ---------- */
  function statusOf(n) {
    var top = n.split('.')[0];
    if (info.bad[n]) return ['no', info.bad[n]];
    if (NO[n]) return ['no', NO[n]];
    if (LTD[n]) return ['ltd', LTD[n]];
    return ['ok', ''];
  }
  var LAB = { ok: 'Works', ltd: 'Limited', no: 'Can’t run' };
  function renderMods() {
    if (!listEl) return;
    var q = qEl.value.trim().toLowerCase(), names = which === 'std' ? info.mods.filter(function (n) { return showPriv || n[0] !== '_'; }) : info.add;
    if (q) names = names.filter(function (n) { return n.toLowerCase().indexOf(q) >= 0; });
    var h = names.map(function (n) {
      var st = which === 'std' ? statusOf(n) : ['add', 'Downloads on first import; needs a network.'];
      return '<li data-n="' + esc(n) + '" class="m-' + st[0] + '"><button type="button" class="mn"><b>' + esc(n) + '</b><span class="mt2">' + (st[0] === 'add' ? 'Add-on' : LAB[st[0]]) + '</span></button>' + (st[1] ? '<p class="note">' + esc(st[1]) + '</p>' : '') + '</li>';
    }).join('');
    listEl.innerHTML = h || '<li class="none">Nothing matches</li>';
    $('.count', modsEl).textContent = names.length + (which === 'std' ? ' of ' + info.mods.filter(function (n) { return showPriv || n[0] !== '_'; }).length : '');
  }
  function peek(n) { var li = listEl.querySelector('li[data-n="' + n + '"]'); if (!li) return; var old = $('.peek', listEl); if (old) { var was = old.parentNode; old.remove(); if (was === li) return; } var d = document.createElement('div'); d.className = 'peek'; d.innerHTML = '<p class="dim">Looking…</p>'; li.appendChild(d); if (ready) worker.postMessage({ t: 'peek', name: n }); }
  function showPeek(m) {
    var li = listEl.querySelector('li[data-n="' + m.name + '"] .peek'); if (!li) return;
    var i = m.info;
    if (i.none) { li.innerHTML = '<p class="dim">This one can’t be opened here.</p>'; return; }
    li.innerHTML = (i.doc ? '<p>' + esc(i.doc) + '</p>' : '') + '<div class="names">' + i.names.map(function (x) { return '<code>' + esc(x) + '</code>'; }).join('') + '</div><button type="button" class="use" data-n="' + esc(m.name) + '">Add import to editor</button>';
  }
  function probe() {
    if (!ready || busy) return;
    var names = info.mods.filter(function (n) { return !SKIP[n]; }); probeN = names.length;
    probing = true; lock(); setChip('Testing modules', 'wait'); chip2.textContent = '0 / ' + probeN; worker.postMessage({ t: 'probe', names: names });
  }

  /* ---------- tabs, layout ---------- */
  function setTab(t) {
    tab = t; root.dataset.tab = t;
    root.querySelectorAll('.tabs button').forEach(function (b) { var on = b.dataset.t === t; b.setAttribute('aria-selected', on); });
    if (t === 'sh') setTimeout(function () { outEl.parentNode.scrollTop = outEl.parentNode.scrollHeight; }, 0);
  }
  function fit() {
    var vv = window.visualViewport, kb = vv && !wide() && (innerHeight - vv.height > 140);
    document.body.classList.toggle('kb', !!kb);
    if (root && vv) { root.style.top = (kb ? vv.offsetTop : $('.top').offsetHeight) + 'px'; root.style.height = (kb ? vv.height : innerHeight - $('.top').offsetHeight) + 'px'; }
  }

  function build() {
    root = document.createElement('section'); root.className = 'ide'; root.dataset.tab = 'ed'; root.setAttribute('aria-label', 'Python editor');
    root.innerHTML =
      '<div class="ibar"><button type="button" class="go" id="iRun"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3l12 7-12 7z" fill="currentColor"/></svg><span>Run</span></button>' +
      '<button type="button" class="st" id="iStop"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="12" fill="currentColor"/></svg><span>Stop</span></button>' +
      '<button type="button" class="ghost" id="iClear">Clear</button><button type="button" class="ghost mbtn" id="iMods" aria-pressed="false">Modules</button><span class="chip wait" id="iChip">Loading Python…</span><span class="chip2" id="iChip2"></span></div>' +
      '<div class="tabs" role="tablist"><button type="button" role="tab" data-t="ed" aria-selected="true">Editor</button><button type="button" role="tab" data-t="sh" aria-selected="false">Shell</button><button type="button" role="tab" data-t="md" aria-selected="false">Modules</button></div>' +
      '<div class="panes">' +
      '<div class="pane ed"><div class="gut" aria-hidden="true"><pre></pre></div><div class="stack"><pre class="hl" aria-hidden="true"></pre><textarea id="iCode" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Python code"></textarea></div></div>' +
      '<div class="pane sh"><div class="scroll"><div class="out" role="log" aria-live="off"></div><div class="prompt"><span class="ps">&gt;&gt;&gt;</span><textarea class="pin" rows="1" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" enterkeyhint="send" aria-label="Shell input"></textarea></div></div></div>' +
      '<div class="pane md"><div class="mhead"><input type="search" id="iQ" placeholder="Find a module" spellcheck="false" autocapitalize="off" aria-label="Find a module"><div class="seg"><button type="button" data-w="std" aria-pressed="true">Standard library</button><button type="button" data-w="add" aria-pressed="false">Add-ons</button></div>' +
      '<div class="mrow"><span class="count"></span><label class="chk"><input type="checkbox" id="iPriv"> Private</label><button type="button" class="ghost" id="iProbe">Test all</button></div></div><ul class="list"></ul></div>' +
      '</div>' +
      '<div class="keys" aria-label="Symbols">' + KEYS.map(function (k) { return '<button type="button" data-k="' + k.replace(/"/g, '&quot;') + '"' + (k === 'Tab' ? ' class="wide"' : '') + '>' + (k === 'Tab' ? '⇥' : k) + '</button>'; }).join('') + '<button type="button" data-k="undo" class="wide" aria-label="Undo">↶</button></div>';
    ta = $('#iCode', root); hl = $('.hl', root); gut = $('.gut', root); outEl = $('.out', root); prompt = $('.prompt', root); ps = $('.ps', root); pin = $('.pin', root);
    runB = $('#iRun', root); stopB = $('#iStop', root); chip = $('#iChip', root); chip2 = $('#iChip2', root); keysEl = $('.keys', root); modsEl = $('.md', root); listEl = $('.list', root); qEl = $('#iQ', root);
    ta.value = store('pyideCode') || SAMPLE; sync();
    ta.addEventListener('input', sync); ta.addEventListener('scroll', scrollSync);
    ta.addEventListener('keydown', function (ev) {
      if (ev.isComposing) return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' || ev.key === 'F5') { ev.preventDefault(); run(); }
      else if (ev.key === 'Tab' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); tabKey(ev.shiftKey); }
      else if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enter(); }
    });
    ta.addEventListener('beforeinput', function (ev) { if ((ev.inputType === 'insertLineBreak' || ev.inputType === 'insertParagraph') && ev.cancelable && !ev.isComposing) { ev.preventDefault(); enter(); } });
    ta.addEventListener('blur', function () { store('pyideCode', ta.value); });
    var tm; ta.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { store('pyideCode', ta.value); }, 400); });

    pin.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); submit(); }
      else if (ev.key === 'Tab' && !needId) { ev.preventDefault(); document.execCommand('insertText', false, '    '); }
      else if (ev.key === 'ArrowUp' && !needId && pin.selectionStart === 0 && hpos > 0) { ev.preventDefault(); pin.value = hist[--hpos]; }
      else if (ev.key === 'ArrowDown' && !needId && hpos < hist.length) { ev.preventDefault(); pin.value = hist[++hpos] || ''; }
      else if (ev.key === 'c' && ev.ctrlKey) { stop(); }
    });
    pin.addEventListener('input', function () { pin.style.height = 'auto'; pin.style.height = pin.scrollHeight + 'px'; });
    outEl.parentNode.addEventListener('click', function (ev) { if (!getSelection().toString() && !ev.target.closest('button')) pin.focus(); });

    runB.onclick = run; stopB.onclick = stop;
    $('#iMods', root).onclick = function (ev) { var on = tab !== 'md'; ev.currentTarget.setAttribute('aria-pressed', on); setTab(on ? 'md' : 'ed'); if (on) renderMods(); };
    $('#iClear', root).onclick = function () { outEl.textContent = ''; };
    root.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { setTab(b.dataset.t); if (b.dataset.t === 'md') renderMods(); }; });
    keysEl.addEventListener('pointerdown', function (ev) { if (ev.target.closest('button')) ev.preventDefault(); });
    keysEl.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.k === 'undo') { ta.focus(); document.execCommand('undo'); sync(); return; }
      if (document.activeElement === pin) { document.execCommand('insertText', false, b.dataset.k === 'Tab' ? '    ' : b.dataset.k); return; }
      key(b.dataset.k);
    });
    qEl.addEventListener('input', renderMods);
    $('#iPriv', root).onchange = function (ev) { showPriv = ev.target.checked; renderMods(); };
    $('#iProbe', root).onclick = probe;
    $('.seg', root).addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return; which = b.dataset.w;
      root.querySelectorAll('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); renderMods();
    });
    listEl.addEventListener('click', function (ev) {
      var u = ev.target.closest('.use');
      if (u) { var n = u.dataset.n; var v = ta.value; if (!new RegExp('^import ' + n + '$', 'm').test(v)) { ta.value = 'import ' + n + '\n' + v; sync(); } setTab('ed'); ta.focus(); ta.setSelectionRange(0, 0); return; }
      var m = ev.target.closest('.mn'); if (m) peek(m.parentNode.dataset.n);
    });
    addEventListener('resize', fit);
    if (window.visualViewport) { visualViewport.addEventListener('resize', fit); visualViewport.addEventListener('scroll', fit); }
    spawn();
  }

  window.__ide = {
    show: function () {
      document.body.classList.add('run'); document.body.classList.remove('idx');
      if (!root) build();
      main.textContent = ''; main.appendChild(root); fit(); document.title = 'Editor · Python Answer Book';
      var ph = store('pyideSeed'); if (ph != null) { store('pyideSeed', ''); try { localStorage.removeItem('pyideSeed'); } catch (_) {} ta.value = ph; sync(); store('pyideCode', ph); setTab('ed'); }
    },
    hide: function () { document.body.classList.remove('run', 'kb'); document.title = 'Python Answer Book'; },
    seed: function (code) { store('pyideSeed', code); location.hash = '#/run'; }
  };
  if (/^#\/run/.test(location.hash)) dispatchEvent(new Event('hashchange'));
})();
