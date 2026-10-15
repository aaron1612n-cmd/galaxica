/* Pybench: an IDLE-style Python workbench. Editor + shell + debugger + turtle + lessons. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k);
  return e;
};
const store = {
  get(k, d) { try { const v = localStorage.getItem('pyb.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pyb.' + k, JSON.stringify(v)); } catch (e) {} },
};
const HOME = '/home/pyodide';
const isMobile = () => matchMedia('(max-width: 899px)').matches;
const S = Object.assign({ theme: 'paper', font: 15, indent: 4, lines: true, context: false, brackets: false, live: true, popup: true,
  friendly: true, debug: false, autostack: false, split: 0.53, tabs: false }, store.get('settings', {}));
const saveS = () => store.set('settings', S);
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

/* ================================================================ Python worker */
const canShare = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;
let W = null, ctl = null, sdata = null, intr = null, state = 'load', reqId = 0, version = '';
const pend = new Map();
let execRes = null, readyWait = [], killTimer = 0;

function spawn() {
  if (W) W.terminate();
  for (const r of pend.values()) r(null);
  pend.clear();
  if (execRes) { execRes.res(null); execRes = null; }
  W = new Worker('worker.js');
  let sab = null, ib = null;
  if (canShare) {
    sab = new SharedArrayBuffer(8 + (1 << 20));
    ib = new SharedArrayBuffer(4);
    ctl = new Int32Array(sab, 0, 2); sdata = new Uint8Array(sab, 8); intr = new Uint8Array(ib);
  }
  W.onmessage = (e) => onWorker(e.data);
  W.onerror = (e) => { out('Python worker failed: ' + (e.message || e) + '\n', 'er'); };
  setState('load');
  W.postMessage({ t: 'boot', sab, intr: ib, files: allFiles() });
}
function whenReady() { return state === 'load' ? new Promise((r) => readyWait.push(r)) : Promise.resolve(); }
function setState(s) {
  state = s;
  const p = $('#pystate');
  p.dataset.s = { load: 'load', ready: 'ready', busy: 'busy', input: 'input', paused: 'paused' }[s];
  $('.tx', p).textContent = { load: 'starting Python', ready: 'ready', busy: 'running', input: 'waiting for input', paused: 'paused in debugger' }[s];
  $('#shin').classList.toggle('busy', s === 'busy');
  if (s !== 'busy') clearTimeout(killTimer);
}
function call(fn, ...args) {
  if (!W) return Promise.resolve(null);
  const id = ++reqId;
  return new Promise((r) => { pend.set(id, r); W.postMessage({ t: 'call', id, fn, args }); });
}
async function exec(msg) {
  await whenReady();
  const id = ++reqId;
  return new Promise((res) => {
    execRes = { id, res };
    msg.id = id;
    setState('busy');
    W.postMessage(msg);
  });
}
function reply(str, cancel) {
  if (!ctl) return;
  const b = new TextEncoder().encode(str || '');
  const n = Math.min(b.length, sdata.length);
  sdata.set(b.subarray(0, n));
  Atomics.store(ctl, 1, n);
  Atomics.store(ctl, 0, cancel ? 2 : 1);
  Atomics.notify(ctl, 0);
}
let turtleSeen = false;
function onWorker(m) {
  switch (m.t) {
    case 'ready':
      version = m.version;
      $('#ver').textContent = 'Python ' + version;
      setState('ready');
      if (!bannerShown) {
        bannerShown = true;
        out(`Python ${version} (CPython on WebAssembly) in your browser\nType "help", "copyright", "credits" or "license()" for more information.\n`, 'sys');
        if (!m.sab) out('This page is not cross-origin isolated, so input() and Stop are limited. Restart still works.\n', 'sys');
      }
      readyWait.splice(0).forEach((r) => r());
      break;
    case 'out': out(m.v, m.s === 'stderr' ? 'er' : ''); break;
    case 'help': if (S.friendly) hint(m.v); if (S.autostack) showPanel('stack'); break;
    case 'errline': markErr(m.file, m.line); break;
    case 'turtle': Turtle.feed(JSON.parse(m.v)); if (!turtleSeen) { turtleSeen = true; if (state !== 'paused' && panelOpen() !== 'turtle') showPanel('turtle', true); } break;
    case 'input': setState('input'); out(m.v || '', ''); stdinMode(true); break;
    case 'pause': setState('paused'); Debug.paused(JSON.parse(m.v)); break;
    case 'nosab': out('input() needs a cross-origin isolated page; it returned nothing here.\n', 'er'); break;
    case 'res': { const r = pend.get(m.id); pend.delete(m.id); if (r) r(m.v); break; }
    case 'done':
      if (execRes && execRes.id === m.id) { const r = execRes.res; execRes = null; setState('ready'); r(m.v); }
      else setState('ready');
      stdinMode(false);
      Debug.done();
      refreshAfterRun();
      break;
    case 'fatal': out('Python could not start: ' + m.v + '\n', 'er'); break;
  }
}
function interrupt() {
  if (state === 'input') { stdinMode(false); out('\n', ''); reply('', true); setState('busy'); return; }
  if (state === 'paused') { Debug.cmd('quit'); return; }
  if (state !== 'busy') return;
  if (intr) {
    intr[0] = 2;
    clearTimeout(killTimer);
    killTimer = setTimeout(() => { if (state === 'busy') { out('\nThe program did not stop, so the shell was restarted.\n', 'er'); restart(); } }, 2500);
  } else restart();
}
function restart(label = 'Shell') {
  Debug.done();
  spawn();
  restartLine('RESTART: ' + label);
}

/* ================================================================ shell output */
const outEl = $('#out'), shellEl = $('#shell');
outEl.classList.add('pyhl');
let bannerShown = false;
function nearBottom() { return shellEl.scrollHeight - shellEl.scrollTop - shellEl.clientHeight < 80; }
function scrollDown(force) { if (force || stick) shellEl.scrollTop = shellEl.scrollHeight; }
let stick = true;
shellEl.addEventListener('scroll', () => { stick = nearBottom(); });
const LOC = /File "([^"]+)", line (\d+)/g;
function out(text, cls) {
  if (!text) return;
  const wasStick = stick || nearBottom();
  let target = outEl.lastChild;
  if (cls === 'er' && LOC.test(text)) {
    LOC.lastIndex = 0;
    const span = el('span', { class: 'er' });
    let last = 0, mm;
    while ((mm = LOC.exec(text))) {
      span.append(text.slice(last, mm.index));
      const file = mm[1], line = +mm[2];
      span.append(el('span', { class: 'loc', title: 'Go to this line', text: mm[0], onclick: () => goFileLine(file, line) }));
      last = mm.index + mm[0].length;
    }
    span.append(text.slice(last));
    outEl.append(span);
  } else if (target && target.nodeType === 1 && target.tagName === 'SPAN' && target.className === (cls || 'o') && target.childElementCount === 0) {
    target.textContent += text;
  } else outEl.append(el('span', { class: cls || 'o', text }));
  trim();
  stick = wasStick; scrollDown();
}
function trim() {
  if (outEl.childNodes.length > 3000) for (let i = 0; i < 800; i++) outEl.firstChild.remove();
  const t = outEl.lastChild;
  if (t && t.textContent.length > 400000) t.textContent = '…' + t.textContent.slice(-200000);
}
function hint(text) {
  outEl.append(el('span', { class: 'hint' }, el('b', { text: 'In plain words:' }), text));
  scrollDown();
}
function restartLine(label) {
  outEl.append(el('div', { class: 'restart', text: label }));
  scrollDown(true);
}
function echo(src) {
  const lines = src.split('\n');
  lines.forEach((ln, i) => {
    outEl.append(el('span', { class: 'ps', text: i ? '... ' : '>>> ' }));
    const s = el('span', { class: 'o' });
    highlight(ln, s);
    outEl.append(s, '\n');
  });
  scrollDown(true);
}
function highlight(text, into) {
  const mode = CodeMirror.getMode({ indentUnit: 4 }, 'python');
  const st = CodeMirror.startState(mode);
  const ss = new CodeMirror.StringStream(text, 4);
  while (!ss.eol()) {
    const style = mode.token(ss, st);
    const tok = ss.current();
    into.append(style ? el('span', { class: style.split(' ').map((c) => 'cm-' + c).join(' '), text: tok }) : tok);
    ss.start = ss.pos;
  }
}

/* ================================================================ shell input */
const hist = store.get('hist', []);
let hIdx = hist.length, hDraft = '';
let stdin = false;
const sh = CodeMirror($('#shin'), {
  mode: 'python', indentUnit: S.indent, tabSize: S.indent, gutters: ['ps-gutter'], lineWrapping: true, viewportMargin: Infinity,
  matchBrackets: true, autoCloseBrackets: S.brackets, inputStyle: 'contenteditable', spellcheck: false, autocorrect: false, autocapitalize: false,
  extraKeys: {
    Enter: shellEnter, 'Ctrl-Enter': (cm) => submit(cm.getValue()), 'Cmd-Enter': (cm) => submit(cm.getValue()),
    'Shift-Enter': 'newlineAndIndent',
    Up: (cm) => (cm.getCursor().line === 0 && !stdin ? histMove(-1) : CodeMirror.Pass),
    Down: (cm) => (cm.getCursor().line === cm.lastLine() && !stdin ? histMove(1) : CodeMirror.Pass),
    'Alt-P': () => histMove(-1), 'Alt-N': () => histMove(1),
    'Ctrl-C': (cm) => {
      if (cm.somethingSelected()) return CodeMirror.Pass;
      if (state === 'ready' && cm.getValue()) { echo(cm.getValue()); out('KeyboardInterrupt\n', 'er'); cm.setValue(''); return; }
      interrupt();
    },
    Tab: smartTab, 'Shift-Tab': 'indentLess', Backspace: smartBackspace,
    'Ctrl-Space': (cm) => cm.showHint({ hint: pyHint, completeSingle: false }),
    'Ctrl-\\': (cm) => callTip(cm, true), F1: (cm) => docFor(wordAt(cm)), 'Ctrl-L': () => clearShell(),
    Esc: () => hideTip(),
  },
});
function psGutter() {
  sh.clearGutter('ps-gutter');
  if (stdin) return;
  for (let i = 0; i < sh.lineCount(); i++) sh.setGutterMarker(i, 'ps-gutter', el('div', { class: 'psm', text: i ? '...' : '>>>' }));
}
sh.on('change', psGutter);
psGutter();
function stdinMode(on) {
  if (stdin === on) return;
  stdin = on;
  $('#shin').classList.toggle('stdin', on);
  psGutter();
  if (on) {
    sh.setValue('');
    if (isMobile()) setView('shell');
    setTimeout(() => sh.focus(), 0);
    scrollDown(true);
  }
}
function histMove(d) {
  if (!hist.length) return;
  if (hIdx === hist.length) hDraft = sh.getValue();
  hIdx = Math.max(0, Math.min(hist.length, hIdx + d));
  sh.setValue(hIdx === hist.length ? hDraft : hist[hIdx]);
  sh.setCursor(sh.lastLine(), sh.getLine(sh.lastLine()).length);
}
function needsMore(src) {
  let depth = 0, str = null, i = 0;
  const s = src;
  while (i < s.length) {
    const c = s[i];
    if (str) {
      if (c === '\\') { i += 2; continue; }
      if (s.startsWith(str, i)) { i += str.length; str = null; continue; }
      i++; continue;
    }
    if (c === '#') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (s.startsWith('"""', i) || s.startsWith("'''", i)) { str = s.substr(i, 3); i += 3; continue; }
    if (c === '"' || c === "'") { str = c; i++; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    i++;
  }
  if (str && str.length === 3) return true;
  if (depth > 0) return true;
  const lastLine = s.split('\n').pop().replace(/#.*$/, '').trimEnd();
  return lastLine.endsWith(':') || lastLine.endsWith('\\') || /^\s*@/.test(lastLine);
}
function shellEnter(cm) {
  hideTip();
  if (stdin) {
    const v = cm.getValue();
    out(v + '\n', 'in');
    cm.setValue('');
    stdinMode(false);
    setState('busy');
    reply(v);
    return;
  }
  if (state !== 'ready' && state !== 'load') return;
  const src = cm.getValue();
  if (cm.lineCount() === 1) {
    if (needsMore(src)) return cm.execCommand('newlineAndIndent');
    return submit(src);
  }
  const last = cm.getLine(cm.lastLine());
  const c = cm.getCursor();
  if (c.line === cm.lastLine() && !last.trim()) return submit(src.replace(/\s+$/, ''));
  if (c.line === cm.lastLine() && !needsMore(src) && !/^\s/.test(last)) return submit(src);
  cm.execCommand('newlineAndIndent');
}
async function submit(src) {
  hideTip();
  sh.setValue('');
  echo(src);
  if (src.trim()) {
    if (hist[hist.length - 1] !== src) hist.push(src);
    if (hist.length > 300) hist.splice(0, hist.length - 300);
    store.set('hist', hist);
  }
  hIdx = hist.length; hDraft = '';
  if (!src.trim()) return;
  mergeFromPython(await exec({ t: 'shell', src, files: allFiles() }));
}
function clearShell() { outEl.textContent = ''; }
shellEl.addEventListener('click', (e) => {
  if (e.target.closest('.loc') || e.target.closest('.CodeMirror')) return;
  if (String(getSelection())) return;
  sh.focus();
});

/* ================================================================ editor, tabs, files */
let files = store.get('files', null);
if (!files) files = { 'hello.py': PB.welcome };
const drafts = store.get('drafts', {});
let tabs = [], cur = null, lastCM = null;
const ed = CodeMirror($('#ed'), {
  mode: 'python', lineNumbers: S.lines, indentUnit: S.indent, tabSize: S.indent, indentWithTabs: S.tabs, matchBrackets: true, styleActiveLine: true,
  autoCloseBrackets: S.brackets, gutters: ['bp-gutter', 'CodeMirror-linenumbers'], inputStyle: 'contenteditable', spellcheck: false, autocorrect: false,
  autocapitalize: false, dragDrop: true, lineWrapping: isMobile(),
  extraKeys: {
    Tab: smartTab, 'Shift-Tab': 'indentLess', Backspace: smartBackspace, Enter: smartEnter,
    'Ctrl-]': 'indentMore', 'Ctrl-[': 'indentLess', 'Cmd-]': 'indentMore', 'Cmd-[': 'indentLess',
    'Alt-3': (cm) => commentRegion(cm, true), 'Alt-4': (cm) => commentRegion(cm, false),
    'Alt-5': (cm) => tabifyRegion(cm, true), 'Alt-6': (cm) => tabifyRegion(cm, false),
    'Alt-Q': formatParagraph, 'Alt-T': () => toggleTabs(), 'Alt-U': () => newIndentWidth(), 'Alt-G': () => gotoLine(),
    'Ctrl-Space': (cm) => cm.showHint({ hint: pyHint, completeSingle: false }), 'Alt-/': expandWord,
    'Ctrl-\\': (cm) => callTip(cm, true), 'Ctrl-0': surroundingParens, F1: (cm) => docFor(wordAt(cm)),
    'Ctrl-F': 'find', 'Cmd-F': 'find', 'Ctrl-G': 'findNext', 'Shift-Ctrl-G': 'findPrev', 'Ctrl-H': 'replace', 'Ctrl-F3': findSelection,
    Esc: () => hideTip(),
  },
});
ed.on('gutterClick', (cm, line, g) => { if (g === 'bp-gutter' || g === 'CodeMirror-linenumbers') toggleBp(line); });
function allFiles() {
  const o = Object.assign({}, files);
  for (const t of tabs) if (!t.ro) o[t.name] = t.doc.getValue();
  return o;
}
function persist() { store.set('files', files); }
const saveDrafts = debounce(() => {
  const d = {};
  for (const t of tabs) if (!t.ro && !t.doc.isClean(t.gen)) d[t.name] = t.doc.getValue();
  store.set('drafts', d);
  store.set('open', tabs.filter((t) => !t.ro).map((t) => t.name));
  store.set('active', cur && cur.name);
}, 400);
function openTab(name, opts = {}) {
  let t = tabs.find((x) => x.name === name);
  if (!t) {
    const text = opts.text != null ? opts.text : files[name] != null ? files[name] : '';
    const doc = CodeMirror.Doc(text, 'python');
    t = { name, doc, ro: !!opts.ro, gen: doc.changeGeneration(), err: null, marks: [] };
    if (opts.dirtyText != null && opts.dirtyText !== text) doc.setValue(opts.dirtyText);
    tabs.push(t);
  }
  activate(t);
  return t;
}
function activate(t) {
  cur = t;
  ed.swapDoc(t.doc);
  ed.setOption('readOnly', t.ro);
  renderTabs();
  updateStatus();
  liveCheck();
  codeContext();
  if (panelOpen() === 'outline') renderOutline();
  saveDrafts();
  if (isMobile() && $('#main').dataset.view !== 'code') setView('code');
}
function renderTabs() {
  const bar = $('#tabs');
  bar.textContent = '';
  for (const t of tabs) {
    const dirty = !t.ro && !t.doc.isClean(t.gen);
    const b = el('div', { class: 'tab' + (dirty ? ' dirty' : '') + (t.ro ? ' ro' : ''), role: 'tab', 'aria-selected': t === cur ? 'true' : 'false', tabindex: '0', title: t.ro ? t.name + ' (read only)' : HOME + '/' + t.name },
      el('span', { text: t.name }), el('i', { class: 'dot' }),
      el('button', { class: 'x', 'aria-label': 'Close ' + t.name, text: '×', onclick: (e) => { e.stopPropagation(); closeTab(t); } }));
    b.addEventListener('click', () => activate(t));
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') activate(t); });
    bar.append(b);
  }
  bar.append(el('button', { class: 'newtab', title: 'New file (Ctrl+Alt+N)', 'aria-label': 'New file', text: '+', onclick: newFile }));
  const a = $('.tab[aria-selected=true]', bar);
  if (a) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('#st-file').textContent = cur ? cur.name + (cur.ro ? ' (read only)' : '') : '';
}
async function closeTab(t) {
  if (!t.ro && !t.doc.isClean(t.gen)) {
    const r = await choose(`Save changes to ${t.name}?`, 'Your edits are kept in this browser until you close the tab.', ['Save', 'Discard', 'Cancel']);
    if (r === 'Cancel' || r == null) return;
    if (r === 'Save') saveTab(t);
  }
  const i = tabs.indexOf(t);
  tabs.splice(i, 1);
  if (!tabs.length) openTab(Object.keys(files)[0] || newName());
  else if (cur === t) activate(tabs[Math.max(0, i - 1)]);
  else renderTabs();
  saveDrafts();
}
function newName(base = 'untitled') {
  let n = base + '.py', i = 2;
  while (files[n] != null || tabs.some((t) => t.name === n)) n = `${base}${i++}.py`;
  return n;
}
function newFile() { const t = openTab(newName()); ed.focus(); return t; }
function saveTab(t = cur) {
  if (!t || t.ro) return;
  files[t.name] = t.doc.getValue();
  t.gen = t.doc.changeGeneration();
  persist(); renderTabs(); saveDrafts();
  if (W && state !== 'load') W.postMessage({ t: 'files', files: { [t.name]: files[t.name] } });
  status(`Saved ${t.name}`);
  addRecent(t.name);
  if (panelOpen() === 'files') renderFiles();
}
async function saveAs(t = cur) {
  if (!t) return;
  let name = await ask('Save as', 'File name', t.ro ? t.name.replace(/^.*\//, '') : t.name);
  if (!name) return;
  name = name.trim().replace(/^\/+/, '');
  if (!/\.\w+$/.test(name)) name += '.py';
  if (name !== t.name && files[name] != null) {
    const r = await choose(`${name} already exists.`, 'Replace it?', ['Replace', 'Cancel']);
    if (r !== 'Replace') return;
  }
  const other = tabs.find((x) => x.name === name && x !== t);
  if (other) tabs.splice(tabs.indexOf(other), 1);
  t.name = name; t.ro = false;
  ed.setOption('readOnly', false);
  saveTab(t);
}
function download(name, text) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: name.replace(/^.*\//, '') });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function addRecent(name) {
  const r = store.get('recent', []).filter((x) => x !== name);
  r.unshift(name); store.set('recent', r.slice(0, 12));
}
function deleteFile(name) {
  delete files[name]; persist();
  const t = tabs.find((x) => x.name === name);
  if (t) { t.gen = t.doc.changeGeneration(); closeTab(t); }
  if (W) W.postMessage({ t: 'rm', name });
  renderFiles();
}
function upload() {
  const inp = el('input', { type: 'file', multiple: true, accept: '.py,.txt,.csv,.json,.md,.pyw,text/*' });
  inp.onchange = async () => {
    for (const f of inp.files) {
      const text = await f.text();
      files[f.name] = text;
      if (/\.pyw?$/.test(f.name)) { const old = tabs.find((t) => t.name === f.name); if (old) { old.doc.setValue(text); old.gen = old.doc.changeGeneration(); } openTab(f.name); }
    }
    persist(); if (W) W.postMessage({ t: 'files', files: allFiles() }); renderFiles();
  };
  inp.click();
}
function mergeFromPython(dump) {
  if (!dump) return;
  let changed = false;
  for (const [name, text] of Object.entries(dump)) {
    if (files[name] === text) continue;
    const t = tabs.find((x) => x.name === name);
    if (t && !t.doc.isClean(t.gen)) continue;
    if (t && t.doc.getValue() === text) { files[name] = text; continue; }
    files[name] = text; changed = true;
    if (t) { const c = t.doc.getCursor(); t.doc.setValue(text); t.doc.setCursor(c); t.gen = t.doc.changeGeneration(); }
  }
  if (changed) { persist(); renderFiles(); }
}
ed.on('changes', () => {
  if (!cur) return;
  renderTabsSoon();
  saveDrafts();
  clearErr(cur);
  liveCheck();
  if (panelOpen() === 'outline') outlineSoon();
});
const renderTabsSoon = debounce(() => renderTabs(), 120);
ed.on('cursorActivity', () => { updateStatus(); codeContextSoon(); paintErr(); });
ed.on('scroll', () => codeContextSoon());
ed.on('focus', () => { lastCM = ed; keysFor(ed); });
sh.on('focus', () => { lastCM = sh; keysFor(sh); });
ed.on('blur', () => keysBlur()); sh.on('blur', () => keysBlur());
function updateStatus() {
  const c = ed.getCursor();
  $('#st-pos').textContent = `Ln ${c.line + 1}, Col ${c.ch}`;
}
let stTimer = 0;
function status(msg, bad, action) {
  const m = $('#st-msg');
  m.textContent = msg || '';
  m.classList.toggle('bad', !!bad);
  if (action) m.append(' ', el('button', { text: action[0], onclick: action[1] }));
  clearTimeout(stTimer);
  if (msg && !bad) stTimer = setTimeout(() => { if (m.textContent.startsWith(msg)) m.textContent = ''; }, 4000);
}

/* ---------- syntax check, error marks */
const liveCheck = debounce(async () => {
  if (!S.live || !cur || cur.ro || state !== 'ready') return;
  const t = cur;
  const r = await call('check_module', t.doc.getValue(), HOME + '/' + t.name);
  t.err = r ? JSON.parse(r) : null;
  if (t === cur) paintErr();
}, 700);
function paintErr() {
  const t = cur;
  if (!t) return;
  for (const m of t.marks) m.clear();
  t.marks = [];
  const e = t.err;
  if (!e) { if ($('#st-msg').classList.contains('bad')) status(''); return; }
  const line = Math.max(0, Math.min(t.doc.lastLine(), e.line - 1));
  if (ed.hasFocus() && ed.getCursor().line === line) return;
  const len = t.doc.getLine(line).length;
  const ch = Math.max(0, Math.min(len - 1, (e.col || 1) - 1));
  t.marks.push(t.doc.markText({ line, ch: len ? ch : 0 }, { line, ch: len || 0 }, { className: 'squig', title: e.msg }));
  status(`Line ${e.line}: ${e.msg}.`, true, ['Why?', () => { alertBox('Syntax error on line ' + e.line, e.msg + '\n\n' + (e.hint || '')); }]);
}
function clearErr(t) {
  if (t.errLine != null) { t.doc.removeLineClass(t.errLine, 'background', 'errline'); t.errLine = null; }
}
function markErr(file, line) {
  if (!file || !file.startsWith(HOME + '/')) return;
  const name = file.slice(HOME.length + 1);
  const t = tabs.find((x) => x.name === name);
  if (!t) return;
  clearErr(t);
  t.errLine = t.doc.addLineClass(Math.max(0, line - 1), 'background', 'errline');
  lastErr = { file, line };
}
let lastErr = null;
function goFileLine(file, line) {
  let name = file.startsWith(HOME + '/') ? file.slice(HOME.length + 1) : null;
  let t;
  if (name && (files[name] != null || tabs.some((x) => x.name === name))) t = openTab(name);
  else if (/^\/lib\/python/.test(file)) { openModuleFile(file, line); return; }
  else return status('That line is inside the shell or Python itself.');
  ed.setCursor({ line: line - 1, ch: 0 });
  ed.scrollIntoView({ line: line - 1, ch: 0 }, 120);
  ed.focus();
}
function openModuleFile() {
  status('That line is inside the Python standard library. Use File > Open Module to read it.');
}

/* ---------- breakpoints */
function toggleBp(line) {
  const info = ed.lineInfo(line);
  if (info.gutterMarkers && info.gutterMarkers['bp-gutter']) { ed.setGutterMarker(line, 'bp-gutter', null); ed.removeLineClass(line, 'background', 'bpline'); }
  else { ed.setGutterMarker(line, 'bp-gutter', el('div', { class: 'bp', title: 'Breakpoint' })); ed.addLineClass(line, 'background', 'bpline'); }
}
function collectBps() {
  const bps = [];
  for (const t of tabs) {
    if (t.ro) continue;
    t.doc.eachLine((lh) => { if (lh.gutterMarkers && lh.gutterMarkers['bp-gutter']) bps.push([t.name, t.doc.getLineNumber(lh) + 1]); });
  }
  return bps;
}
function clearBps() {
  for (const t of tabs) t.doc.eachLine((lh) => { if (lh.gutterMarkers && lh.gutterMarkers['bp-gutter']) { const n = t.doc.getLineNumber(lh); if (t === cur) { ed.setGutterMarker(n, 'bp-gutter', null); } else lh.gutterMarkers = null; t.doc.removeLineClass(n, 'background', 'bpline'); } });
}

/* ---------- code context */
const HEAD = /^\s*(class|def|async\s+def|if|elif|else|for|async\s+for|while|try|except|finally|with|async\s+with|match|case)\b/;
function codeContext() {
  const box = $('#ctx');
  box.hidden = !S.context;
  if (!S.context) return;
  const top = ed.lineAtHeight(ed.getScrollInfo().top + 2, 'local');
  const out = [];
  let thr = Infinity;
  for (let l = top; l < Math.min(top + 30, ed.lineCount()); l++) { const s = ed.getLine(l); if (s.trim()) { thr = s.search(/\S/); break; } }
  for (let l = top - 1; l >= 0 && out.length < 4; l--) {
    const s = ed.getLine(l);
    if (!s.trim()) continue;
    const ind = s.search(/\S/);
    if (ind < thr && HEAD.test(s)) { out.unshift([l, s]); thr = ind; if (!ind) break; }
  }
  box.textContent = '';
  if (!out.length) box.append(el('div', { text: ' ' }));
  for (const [l, s] of out) box.append(el('div', { text: s.replace(/\s+$/, ''), title: 'Line ' + (l + 1), onclick: () => { ed.setCursor(l, 0); ed.scrollIntoView({ line: l, ch: 0 }, 60); ed.focus(); } }));
}
const codeContextSoon = debounce(codeContext, 60);

/* ================================================================ editing commands (IDLE's Format menu and friends) */
function unit(cm) { return cm.getOption('indentUnit'); }
function smartTab(cm) {
  if (cm.somethingSelected()) return cm.indentSelection('add');
  const c = cm.getCursor(), before = cm.getLine(c.line).slice(0, c.ch);
  const w = before.match(/[A-Za-z_][\w.]*$/);
  if (w && !/^\s*$/.test(before)) return cm.showHint({ hint: pyHint, completeSingle: true });
  if (cm.getOption('indentWithTabs')) return cm.replaceSelection('\t');
  const col = CodeMirror.countColumn(before, null, cm.getOption('tabSize'));
  cm.replaceSelection(' '.repeat(unit(cm) - (col % unit(cm))));
}
function smartBackspace(cm) {
  if (cm.somethingSelected()) return CodeMirror.Pass;
  const c = cm.getCursor(), before = cm.getLine(c.line).slice(0, c.ch);
  if (c.ch > 0 && /^ +$/.test(before)) {
    const n = (before.length % unit(cm)) || unit(cm);
    cm.replaceRange('', { line: c.line, ch: c.ch - n }, c);
    return;
  }
  return CodeMirror.Pass;
}
function smartEnter(cm) {
  hideTip();
  const c = cm.getCursor();
  const line = cm.getLine(c.line).slice(0, c.ch).trim();
  cm.execCommand('newlineAndIndent');
  if (/^(break|continue|raise)\b/.test(line)) cm.indentLine(cm.getCursor().line, 'subtract');
}
function selLines(cm) {
  const f = cm.getCursor('from'), t = cm.getCursor('to');
  let end = t.line;
  if (t.ch === 0 && t.line > f.line) end--;
  return [f.line, end];
}
function editLines(cm, fn) {
  const [a, b] = selLines(cm);
  cm.operation(() => {
    for (let l = a; l <= b; l++) {
      const s = cm.getLine(l), n = fn(s);
      if (n !== s) cm.replaceRange(n, { line: l, ch: 0 }, { line: l, ch: s.length });
    }
  });
  cm.setSelection({ line: a, ch: 0 }, { line: b, ch: cm.getLine(b).length });
}
function commentRegion(cm, on) {
  editLines(cm, (s) => on ? '##' + s : s.replace(/^(\s*)##?/, '$1'));
}
function tabifyRegion(cm, toTabs) {
  const u = unit(cm), tab = cm.getOption('tabSize');
  editLines(cm, (s) => {
    const m = s.match(/^[ \t]*/)[0];
    const col = CodeMirror.countColumn(m, null, tab);
    const lead = toTabs ? '\t'.repeat(Math.floor(col / u)) + ' '.repeat(col % u) : ' '.repeat(col);
    return lead + s.slice(m.length);
  });
}
function stripTrailing() {
  const cm = ed;
  cm.operation(() => cm.eachLine((lh) => {
    const m = lh.text.match(/[ \t]+$/);
    if (m) { const n = cm.getLineNumber(lh); cm.replaceRange('', { line: n, ch: lh.text.length - m[0].length }, { line: n, ch: lh.text.length }); }
  }));
  status('Trailing whitespace removed');
}
function formatParagraph(cm) {
  let a = cm.getCursor().line, b = a;
  const blank = (l) => !cm.getLine(l).trim() || /^\s*#\s*$/.test(cm.getLine(l));
  if (blank(a)) return;
  while (a > 0 && !blank(a - 1)) a--;
  while (b < cm.lastLine() && !blank(b + 1)) b++;
  const first = cm.getLine(a);
  const pre = first.match(/^\s*(#+\s?)?/)[0];
  const words = [];
  for (let l = a; l <= b; l++) words.push(...cm.getLine(l).slice(cm.getLine(l).startsWith(pre) ? pre.length : 0).trim().split(/\s+/).filter(Boolean));
  const width = 72 - pre.length, lines = [];
  let cur = '';
  for (const w of words) { if (cur && cur.length + 1 + w.length > width) { lines.push(pre + cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  if (cur) lines.push(pre + cur);
  cm.replaceRange(lines.join('\n'), { line: a, ch: 0 }, { line: b, ch: cm.getLine(b).length });
}
function toggleTabs() {
  S.tabs = !S.tabs; saveS();
  ed.setOption('indentWithTabs', S.tabs);
  status(S.tabs ? 'Indent with tabs' : 'Indent with spaces');
}
async function newIndentWidth() {
  const v = await ask('New indent width', 'Spaces per indent (2 to 16)', String(S.indent));
  const n = parseInt(v, 10);
  if (!(n >= 2 && n <= 16)) return;
  S.indent = n; saveS();
  for (const cm of [ed, sh]) { cm.setOption('indentUnit', n); cm.setOption('tabSize', n); }
}
async function gotoLine() {
  const v = await ask('Go to line', 'Line number', String(ed.getCursor().line + 1));
  const n = parseInt(v, 10);
  if (!n) return;
  ed.setCursor(n - 1, 0); ed.scrollIntoView({ line: n - 1, ch: 0 }, 100); ed.focus();
}
function findSelection(cm) {
  const q = cm.getSelection() || wordAt(cm);
  if (!q) return;
  let sc = cm.getSearchCursor(q, cm.getCursor('to'));
  if (sc.findNext() || (sc = cm.getSearchCursor(q, { line: 0, ch: 0 })).findNext()) { cm.setSelection(sc.from(), sc.to()); cm.scrollIntoView({ from: sc.from(), to: sc.to() }, 60); }
}
let expand = null;
function expandWord(cm) {
  const c = cm.getCursor(), before = cm.getLine(c.line).slice(0, c.ch);
  const m = before.match(/[\w]+$/);
  if (expand && expand.line === c.line && expand.ch === c.ch) {
    expand.i = (expand.i + 1) % expand.list.length;
  } else {
    if (!m) return;
    const pre = m[0], seen = new Set([pre]), list = [];
    const words = (allFiles()[cur && cur.name] || cm.getValue()).match(/[A-Za-z_]\w*/g) || [];
    for (const t of tabs) words.push(...(t.doc.getValue().match(/[A-Za-z_]\w*/g) || []));
    for (const w of words.reverse()) if (w.startsWith(pre) && !seen.has(w)) { seen.add(w); list.push(w); }
    if (!list.length) return;
    list.push(pre);
    expand = { pre, list, i: 0, start: c.ch - pre.length, line: c.line, ch: c.ch };
  }
  const w = expand.list[expand.i];
  cm.replaceRange(w, { line: expand.line, ch: expand.start }, { line: expand.line, ch: expand.ch });
  expand.ch = expand.start + w.length;
}
function surroundingParens(cm) {
  const pos = cm.getCursor(), text = cm.getRange({ line: 0, ch: 0 }, pos);
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (')]}'.includes(ch)) depth++;
    else if ('([{'.includes(ch)) {
      if (depth === 0) {
        const from = cm.posFromIndex(i);
        const m = cm.findMatchingBracket({ line: from.line, ch: from.ch + 1 }, { strict: true });
        if (m && m.match) {
          const mk = cm.markText(from, { line: m.to.line, ch: m.to.ch + 1 }, { className: 'CodeMirror-selected' });
          setTimeout(() => mk.clear(), 900);
        }
        return;
      }
      depth--;
    }
  }
}
function wordAt(cm) {
  if (cm.somethingSelected()) return cm.getSelection().trim();
  const c = cm.getCursor(), line = cm.getLine(c.line);
  let a = c.ch, b = c.ch;
  while (a > 0 && /[\w.]/.test(line[a - 1])) a--;
  while (b < line.length && /\w/.test(line[b])) b++;
  return line.slice(a, b).replace(/^\.+|\.+$/g, '');
}

/* ---------- completions and call tips */
function localWords(cm) {
  const set = new Set();
  for (const t of tabs) for (const w of t.doc.getValue().match(/[A-Za-z_]\w{2,}/g) || []) set.add(w);
  for (const w of cm.getValue().match(/[A-Za-z_]\w{2,}/g) || []) set.add(w);
  return set;
}
function pyHint(cm, cb) {
  const c = cm.getCursor(), before = cm.getLine(c.line).slice(0, c.ch);
  const m = before.match(/[A-Za-z_][\w.]*$/) || ['' ];
  const text = m[0];
  const from = { line: c.line, ch: c.ch - text.length };
  const finish = (list) => {
    const tail = text.split('.').pop();
    const items = list.filter((s) => s !== text).map((s) => ({ text: s, displayText: s.split('.').pop() || s }));
    if (!text.includes('.')) for (const w of localWords(cm)) if (w.startsWith(tail) && w !== tail && !list.includes(w)) items.push({ text: w, displayText: w });
    items.sort((x, y) => (x.displayText.startsWith('_') - y.displayText.startsWith('_')) || x.displayText.localeCompare(y.displayText));
    cb(items.length ? { list: items.slice(0, 120), from, to: c } : null);
  };
  if (state !== 'ready') return finish([]);
  call('complete', text).then((r) => finish(r ? JSON.parse(r) : []));
}
pyHint.async = true;
const tipEl = el('div', { class: 'CodeMirror-hints', style: 'position:fixed;padding:6px 10px;max-width:min(520px,90vw);white-space:normal;display:none;z-index:55;pointer-events:none' });
document.body.append(tipEl);
let tipLine = -1, tipCM = null;
function hideTip() { tipEl.style.display = 'none'; tipLine = -1; }
async function callTip(cm, forced) {
  const c = cm.getCursor(), before = cm.getLine(c.line).slice(0, c.ch);
  let depth = 0, i = before.length - 1;
  for (; i >= 0; i--) { const ch = before[i]; if (ch === ')') depth++; else if (ch === '(') { if (!depth) break; depth--; } }
  if (i < 0) return forced && hideTip();
  const m = before.slice(0, i).match(/[A-Za-z_][\w.]*$/);
  if (!m || state !== 'ready') return;
  const r = await call('calltip', m[0]);
  if (!r) return hideTip();
  const tip = JSON.parse(r);
  tipEl.textContent = '';
  tipEl.append(el('div', { style: 'font-weight:600', text: tip.sig }));
  if (tip.doc) tipEl.append(el('div', { style: 'color:var(--graphite);font-family:var(--ui);margin-top:3px', text: tip.doc }));
  const p = cm.cursorCoords(c, 'window');
  tipEl.style.display = 'block';
  const h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(6, Math.min(p.left - 20, innerWidth - tipEl.offsetWidth - 6)) + 'px';
  tipEl.style.top = (p.top - h - 6 > 4 ? p.top - h - 6 : p.bottom + 6) + 'px';
  tipLine = c.line; tipCM = cm;
}
for (const cm of [ed, sh]) {
  cm.on('inputRead', (cm2, ch) => {
    const t = ch.text.join('');
    if (t === '(') callTip(cm2);
    else if (t === ')') hideTip();
    else if (t === '.' && S.popup && state === 'ready') {
      const before = cm2.getLine(cm2.getCursor().line).slice(0, cm2.getCursor().ch);
      if (/[A-Za-z_)\]]\.$/.test(before) && !/\d\.$/.test(before)) setTimeout(() => { if (!cm2.state.completionActive) cm2.showHint({ hint: pyHint, completeSingle: false }); }, 250);
    }
  });
  cm.on('cursorActivity', (cm2) => { if (tipCM === cm2 && cm2.getCursor().line !== tipLine) hideTip(); });
  cm.on('blur', () => hideTip());
}

/* ================================================================ run, check, debug */
async function runModule(opts = {}) {
  if (!cur) return;
  const t = cur;
  if (t.ro) return status('This is a read-only view. Use File > Save As to make your own copy.');
  saveTab(t);
  if (state === 'busy' || state === 'input' || state === 'paused') { Debug.done(); spawn(); }
  await whenReady();
  clearErr(t);
  turtleSeen = false;
  Turtle.reset();
  restartLine('RESTART: ' + HOME + '/' + t.name);
  if (isMobile()) setView('shell');
  const debug = opts.debug != null ? opts.debug : S.debug;
  if (debug) showPanel('debug');
  const dump = await exec({ t: 'run', name: t.name, src: t.doc.getValue(), files: allFiles(), debug, bps: collectBps(), argv: opts.argv });
  mergeFromPython(dump);
}
async function runCustom() {
  const v = await ask('Run customized', 'Command line arguments (sys.argv[1:])', store.get('argv', ''));
  if (v == null) return;
  store.set('argv', v);
  const args = (v.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((a) => a.replace(/^["']|["']$/g, ''));
  runModule({ argv: [HOME + '/' + cur.name, ...args] });
}
async function checkModule() {
  if (!cur) return;
  await whenReady();
  if (state !== 'ready') return status('Wait for the running program to finish.');
  const r = await call('check_module', cur.doc.getValue(), HOME + '/' + cur.name);
  cur.err = r ? JSON.parse(r) : null;
  if (!r) { status('Check Module: no syntax errors.'); return; }
  const e = cur.err;
  ed.setCursor(e.line - 1, Math.max(0, e.col - 1));
  ed.focus();
  alertBox('Syntax error on line ' + e.line, e.msg + '\n\n' + (e.hint || ''));
}
function refreshAfterRun() {
  const p = panelOpen();
  if (p === 'vars') renderVars();
  if (p === 'files') renderFiles();
  if (p === 'stack') renderStack();
  liveCheck();
}

const Debug = {
  info: null, line: null, prev: {},
  paused(info) {
    this.info = info;
    showPanel('debug');
    this.clearLine();
    if (files[info.file] != null || tabs.some((x) => x.name === info.file)) {
      const t = tabs.find((x) => x.name === info.file) || openTab(info.file);
      if (t !== cur) activate(t);
      this.line = [t, t.doc.addLineClass(info.line - 1, 'background', 'dbgline')];
      ed.scrollIntoView({ line: info.line - 1, ch: 0 }, 100);
    }
    if (isMobile()) setView('side');
    renderDebug();
  },
  clearLine() { if (this.line) { this.line[0].doc.removeLineClass(this.line[1], 'background', 'dbgline'); this.line = null; } },
  cmd(c) {
    if (state !== 'paused') return;
    const info = this.info;
    if (info) { const p = {}; for (const [k, , v] of info.locals) p[info.func + ':' + k] = v; this.prev = p; }
    this.clearLine();
    this.info = null;
    setState('busy');
    renderDebug();
    reply(JSON.stringify({ c, bps: collectBps() }));
  },
  done() { this.clearLine(); this.info = null; this.prev = {}; if (panelOpen() === 'debug') renderDebug(); },
};

/* ================================================================ turtle */
const Turtle = (() => {
  const box = el('div', { id: 'turtle' });
  const base = el('canvas'), top = el('canvas');
  box.append(base, top);
  const bx = base.getContext('2d'), tx = top.getContext('2d');
  let ops = [], q = [], turt = {}, bg = null, instant = false, anim = null, raf = 0, fillAt = {}, speedMode = 'code';
  const VW = 720, VH = 560;
  let scale = 1, W = 0, H = 0, dpr = 1;
  function size() {
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    for (const c of [base, top]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    scale = Math.min(W / VW, H / VH);
    redraw();
    return true;
  }
  new ResizeObserver(() => size()).observe(box);
  const X = (x) => W / 2 + x * scale, Y = (y) => H / 2 - y * scale;
  function paper() { return getComputedStyle(document.documentElement).getPropertyValue('--well').trim() || '#fff'; }
  function redraw() {
    bx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bx.fillStyle = bg || paper();
    bx.fillRect(0, 0, W, H);
    for (const o of ops) drawOp(bx, o);
    drawTop();
  }
  function drawOp(c, o) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    switch (o[0]) {
      case 'line': c.strokeStyle = o[6]; c.lineWidth = Math.max(1, o[7] * scale); c.beginPath(); c.moveTo(X(o[2]), Y(o[3])); c.lineTo(X(o[4]), Y(o[5])); c.stroke(); break;
      case 'dot': c.fillStyle = o[5]; c.beginPath(); c.arc(X(o[2]), Y(o[3]), Math.max(1, o[4] * scale / 2), 0, Math.PI * 2); c.fill(); break;
      case 'fill': c.fillStyle = o[3]; c.beginPath(); o[2].forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])))); c.closePath(); c.fill('evenodd'); break;
      case 'write': {
        const f = o[7] || []; c.fillStyle = o[5];
        c.font = `${f[2] && /bold/.test(f[2]) ? 700 : 400} ${Math.max(8, (f[1] || 8) * 1.4 * scale)}px ${/courier|mono/i.test(f[0] || '') ? 'IBM Plex Mono' : 'Atkinson Hyperlegible'}, sans-serif`;
        c.textAlign = o[6] === 'center' ? 'center' : o[6] === 'right' ? 'right' : 'left'; c.textBaseline = 'alphabetic';
        c.fillText(o[4], X(o[2]), Y(o[3])); break;
      }
      case 'stamp': sprite(c, { x: o[2], y: o[3], h: o[4], fc: o[5], pc: o[6], shape: o[7], vis: true }); break;
    }
  }
  const SHAPES = {
    classic: [[0, 0], [-9, 5], [-7, 0], [-9, -5]],
    arrow: [[10, 0], [-6, 8], [-6, -8]],
    triangle: [[10, 0], [-6, 8], [-6, -8]],
    square: [[8, 8], [-8, 8], [-8, -8], [8, -8]],
    turtle: [[12, 0], [9, 3], [7, 3], [6, 7], [3, 6], [-2, 8], [-4, 6], [-8, 4], [-12, 0], [-8, -4], [-4, -6], [-2, -8], [3, -6], [6, -7], [7, -3], [9, -3]],
  };
  function sprite(c, t) {
    if (!t.vis) return;
    const a = -t.h * Math.PI / 180;
    c.save();
    c.translate(X(t.x), Y(t.y)); c.rotate(a);
    const k = Math.max(0.8, scale * 1.1);
    c.beginPath();
    if (t.shape === 'circle') c.arc(0, 0, 7 * k, 0, Math.PI * 2);
    else (SHAPES[t.shape] || SHAPES.classic).forEach((p, i) => (i ? c.lineTo(p[0] * k, p[1] * k) : c.moveTo(p[0] * k, p[1] * k)));
    c.closePath();
    c.fillStyle = t.fc || '#000'; c.strokeStyle = t.pc || '#000'; c.lineWidth = 1;
    c.fill(); c.stroke();
    c.restore();
  }
  function drawTop() {
    tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tx.clearRect(0, 0, W, H);
    if (anim) drawOp(tx, ['line', 0, anim.op[2], anim.op[3], anim.cx, anim.cy, anim.op[6], anim.op[7]]);
    for (const t of Object.values(turt)) sprite(tx, t);
  }
  function T(id) { return turt[id] || (turt[id] = { x: 0, y: 0, h: 0, vis: true, shape: 'classic', pc: 'black', fc: 'black', speed: 3 }); }
  function apply(c) {
    const [k, id] = c;
    switch (k) {
      case 'new': { const t = T(id); t.shape = c[2]; t.vis = c[3]; break; }
      case 'line': case 'dot': case 'write': case 'stamp': ops.push(c); drawOp(bx, c); if (k === 'line') { const t = T(id); t.x = c[4]; t.y = c[5]; } break;
      case 'move': { const t = T(id); t.x = c[2]; t.y = c[3]; break; }
      case 'turn': T(id).h = c[2]; break;
      case 'color': { const t = T(id); t.pc = c[2]; t.fc = c[3]; break; }
      case 'vis': T(id).vis = c[2]; break;
      case 'speed': T(id).speed = c[2]; break;
      case 'shape': T(id).shape = c[2]; break;
      case 'bfill': fillAt[id] = ops.length; break;
      case 'fill': ops.splice(fillAt[id] != null ? fillAt[id] : ops.length, 0, c); delete fillAt[id]; redraw(); break;
      case 'clear': ops = ops.filter((o) => o[1] !== id); redraw(); break;
      case 'reset': ops = ops.filter((o) => o[1] !== id); Object.assign(T(id), { x: 0, y: 0, h: 0, pc: 'black', fc: 'black' }); redraw(); break;
      case 'clearall': ops = []; turt = {}; bg = null; redraw(); break;
      case 'bg': bg = c[1]; redraw(); break;
      case 'tracer': instant = c[1] === 0; break;
    }
  }
  function frame() {
    raf = 0;
    if (!W && !size()) { raf = requestAnimationFrame(frame); return; }
    let budget = 1;
    let guard = 0;
    while ((q.length || anim) && guard++ < 20000) {
      if (anim) {
        const t = T(anim.op[1]);
        const sp = speedMode === 'instant' ? 0 : speedMode === 'fast' ? 0 : t.speed;
        if (instant || sp === 0) { finishAnim(); continue; }
        const step = (sp >= 10 ? 26 : sp * 2.4) * budget;
        anim.d = Math.min(anim.len, anim.d + step);
        const f = anim.len ? anim.d / anim.len : 1;
        anim.cx = anim.op[2] + (anim.op[4] - anim.op[2]) * f; anim.cy = anim.op[3] + (anim.op[5] - anim.op[3]) * f;
        t.x = anim.cx; t.y = anim.cy;
        if (anim.d >= anim.len) finishAnim();
        else break;
        continue;
      }
      const c = q.shift();
      if (c[0] === 'line' && !instant && speedMode !== 'instant') {
        const t = T(c[1]);
        const sp = speedMode === 'fast' ? 0 : t.speed;
        const len = Math.hypot(c[4] - c[2], c[5] - c[3]);
        if (sp > 0 && len > 0.5) { anim = { op: c, len, d: 0, cx: c[2], cy: c[3] }; continue; }
      }
      apply(c);
      if (speedMode !== 'instant' && !instant && c[0] === 'line') { const sp = speedMode === 'fast' ? 0 : T(c[1]).speed; if (sp > 0) break; }
      if (!instant && speedMode === 'fast' && guard > 400) break;
    }
    drawTop();
    if (q.length || anim) raf = requestAnimationFrame(frame);
  }
  function finishAnim() { const c = anim.op; anim = null; apply(c); }
  return {
    el: box,
    feed(cmds) { q.push(...cmds); if (!raf) raf = requestAnimationFrame(frame); },
    reset() { q = []; anim = null; ops = []; turt = {}; bg = null; instant = false; fillAt = {}; if (W) redraw(); },
    redraw() { size(); },
    setSpeed(m) { speedMode = m; },
    png() { const c = el('canvas'); c.width = base.width; c.height = base.height; const x = c.getContext('2d'); x.drawImage(base, 0, 0); return c.toDataURL('image/png'); },
    get count() { return ops.length; },
  };
})();

/* ================================================================ side panels */
const PANELS = [
  ['learn', 'Learn'], ['vars', 'Vars'], ['debug', 'Debug'], ['turtle', 'Turtle'], ['outline', 'Outline'], ['files', 'Files'], ['stack', 'Stack'], ['docs', 'Docs'], ['cheats', 'Cheats'],
];
let panel = store.get('panel', 'learn');
let sideOpen = store.get('sideOpen', true);
function panelOpen() { if (isMobile()) return $('#main').dataset.view === 'side' ? panel : null; return sideOpen ? panel : null; }
function renderRail() {
  const r = $('#rail');
  r.textContent = '';
  for (const [id, name] of PANELS) r.append(el('button', { class: 'rb', role: 'tab', 'aria-selected': sideOpen && panel === id ? 'true' : 'false', text: name, onclick: () => (sideOpen && panel === id ? closeSide() : showPanel(id)) }));
}
function closeSide() { sideOpen = false; store.set('sideOpen', false); $('#main').classList.add('noside'); renderRail(); }
function showPanel(id, quiet) {
  panel = id; store.set('panel', id);
  if (isMobile()) { if (!quiet || id === 'turtle') { $('#main').dataset.view = 'side'; } }
  else { sideOpen = true; store.set('sideOpen', true); $('#main').classList.remove('noside'); }
  renderRail();
  renderMnav();
  $('#sidettl').textContent = (PANELS.find((p) => p[0] === id) || [, 'Tools'])[1];
  const acts = $('#sideacts'); acts.textContent = '';
  const p = $('#panel'); p.textContent = ''; p.className = 'panel pyhl'; p.style.cssText = '';
  if (!isMobile()) acts.append(el('button', { class: 'hb', text: 'Hide', title: 'Hide the panel', onclick: closeSide }));
  if (isMobile() && $('#main').dataset.view === 'side') setTimeout(() => { if (id === 'turtle') Turtle.redraw(); }, 0);
  ({ learn: renderLearn, vars: renderVars, debug: renderDebug, turtle: renderTurtle, outline: renderOutline, files: renderFiles, stack: renderStack, docs: renderDocs, cheats: renderCheats, tools: renderTools }[id] || renderLearn)();
}
function varTable(rows, prev, key) {
  const tb = el('table', { class: 'vt' }, el('thead', {}, el('tr', {}, el('th', { text: 'Name' }), el('th', { text: 'Type' }), el('th', { text: 'Value' }))));
  const body = el('tbody');
  for (const [n, t, v] of rows) body.append(el('tr', { class: prev && prev[key(n)] !== undefined && prev[key(n)] !== v ? 'chg' : '' }, el('td', { text: n }), el('td', { class: 'ty', text: t }), el('td', { class: 'vl', text: v })));
  tb.append(body);
  return tb;
}
let prevVars = {};
async function renderVars() {
  const p = $('#panel');
  if (state !== 'ready') { if (!p.childElementCount) p.append(el('div', { class: 'empty', text: 'Variables appear here when the program is not running.' })); return; }
  const r = await call('variables');
  if (panelOpen() !== 'vars') return;
  const rows = r ? JSON.parse(r) : [];
  p.textContent = '';
  if (!rows.length) { p.append(el('div', { class: 'empty', text: 'No variables yet. Run your file or type  x = 5  in the shell.' })); return; }
  p.append(varTable(rows, prevVars, (n) => n));
  prevVars = Object.fromEntries(rows.map((r2) => [r2[0], r2[2]]));
}
function renderDebug() {
  if (panelOpen() !== 'debug') return;
  const p = $('#panel'); p.textContent = '';
  const info = Debug.info;
  const B = (label, c, title) => el('button', { class: 'btn' + (c === 'step' ? ' pri' : ''), text: label, title, disabled: !info, onclick: () => Debug.cmd(c) });
  p.append(el('div', { class: 'dbar' }, B('Go', 'go', 'Run to the next breakpoint (F8)'), B('Step', 'step', 'Next line, into calls (F11)'), B('Over', 'over', 'Next line, over calls (F10)'), B('Out', 'out', 'Finish this function (Shift+F11)'), B('Quit', 'quit', 'Stop the program')));
  const toggle = el('label', { class: 'fld', style: 'padding:10px 14px 0;margin:0' }, el('input', { type: 'checkbox', checked: S.debug, onchange: (e) => { S.debug = e.target.checked; saveS(); buildMenus(); } }), el('span', { style: 'width:auto', text: 'Use the debugger when I press Run' }));
  if (!info) {
    p.append(toggle, el('div', { class: 'empty', text: S.debug ? 'Press Run (F5). The program stops at its first line; then step through it and watch the variables. Click the gutter beside a line number to set a breakpoint.' : 'Tick the box, then press Run to step through your program line by line.' }));
    return;
  }
  p.append(el('div', { class: 'where' }, el('span', { class: 'k', text: info.func === '<module>' ? 'module level' : info.func + '()' }), `  line ${info.line} of ${info.file}`));
  p.append(el('div', { class: 'sec', text: 'Locals' }), varTable(info.locals, Debug.prev, (n) => info.func + ':' + n));
  if (info.globals && info.globals.length) p.append(el('div', { class: 'sec', text: 'Globals' }), varTable(info.globals));
  p.append(el('div', { class: 'sec', text: 'Stack' }));
  const ul = el('ul', { class: 'list' });
  for (const f of info.stack) ul.append(el('li', {}, el('button', { onclick: () => goFileLine(HOME + '/' + f.file, f.line) }, el('span', { class: 'k', text: f.func }), el('span', { text: `${f.file}:${f.line}` }))));
  p.append(ul, toggle);
}
function renderTurtle() {
  const p = $('#panel');
  p.style.display = 'flex'; p.style.flexDirection = 'column'; p.style.overflow = 'hidden';
  const sel = el('select', { 'aria-label': 'Drawing speed', onchange: (e) => Turtle.setSpeed(e.target.value) },
    el('option', { value: 'code', text: 'Speed as coded' }), el('option', { value: 'fast', text: 'Fast' }), el('option', { value: 'instant', text: 'Instant' }));
  p.append(el('div', { class: 'tbar' }, sel, el('span', { class: 'sp' }),
    el('button', { class: 'hb', text: 'Save PNG', onclick: () => { const a = el('a', { href: Turtle.png(), download: 'turtle.png' }); document.body.append(a); a.click(); a.remove(); } }),
    el('button', { class: 'hb', text: 'Clear', onclick: () => Turtle.reset() })), Turtle.el);
  requestAnimationFrame(() => Turtle.redraw());
}
const outlineSoon = debounce(() => renderOutline(), 500);
async function renderOutline() {
  if (panelOpen() !== 'outline') return;
  const p = $('#panel');
  if (!cur) return;
  if (state === 'busy' || state === 'input' || state === 'paused') { if (!p.childElementCount) p.append(el('div', { class: 'empty', text: 'The outline updates when the program is idle.' })); return; }
  await whenReady();
  const r = await call('outline', cur.doc.getValue());
  if (panelOpen() !== 'outline') return;
  const items = r ? JSON.parse(r) : [];
  p.textContent = '';
  p.append(el('div', { class: 'sec', text: 'Module browser: ' + cur.name }));
  if (!items.length) { p.append(el('div', { class: 'empty', text: 'No classes or functions in this file yet.' })); return; }
  const ul = el('ul', { class: 'list' });
  for (const [kind, name, line, depth] of items) ul.append(el('li', {}, el('button', { style: `padding-left:${14 + depth * 18}px`, onclick: () => { ed.setCursor(line - 1, 0); ed.scrollIntoView({ line: line - 1, ch: 0 }, 80); if (isMobile()) setView('code'); ed.focus(); } }, el('span', { class: 'k', text: kind }), el('span', { text: name }), el('span', { class: 'mut', text: String(line) }))));
  p.append(ul);
}
async function renderFiles() {
  if (panelOpen() !== 'files') return;
  const p = $('#panel'); p.textContent = '';
  p.append(el('div', { class: 'dbar' }, el('button', { class: 'btn', text: 'New', onclick: newFile }), el('button', { class: 'btn', text: 'Upload', onclick: upload }), el('button', { class: 'btn', text: 'Download all', onclick: () => { for (const [n, s] of Object.entries(allFiles())) download(n, s); } })));
  p.append(el('div', { class: 'sec', text: 'Files in ' + HOME }));
  const ul = el('ul', { class: 'list' });
  const names = Object.keys(allFiles()).sort();
  if (!names.length) p.append(el('div', { class: 'empty', text: 'No files.' }));
  for (const n of names) {
    const size = (allFiles()[n] || '').length;
    const li = el('li', { style: 'display:flex' },
      el('button', { style: 'flex:1', onclick: () => openTab(n) }, el('span', { text: n }), el('span', { class: 'mut', text: size + ' ch' })),
      el('button', { class: 'hb', title: 'Download ' + n, text: 'Save', onclick: () => download(n, allFiles()[n]) }),
      el('button', { class: 'hb', title: 'Delete ' + n, text: 'Delete', onclick: async () => { if ((await choose(`Delete ${n}?`, 'This cannot be undone.', ['Delete', 'Cancel'])) === 'Delete') deleteFile(n); } }));
    ul.append(li);
  }
  p.append(ul);
  if (state === 'ready') {
    const r = await call('syspath');
    if (!r || panelOpen() !== 'files') return;
    const info = JSON.parse(r);
    p.append(el('div', { class: 'sec', text: 'Path browser: sys.path' }));
    const ul2 = el('ul', { class: 'list' });
    for (const d of info.path) ul2.append(el('li', {}, el('button', { onclick: () => {} }, el('span', { text: d || '(current folder)' }))));
    p.append(ul2, el('div', { class: 'empty', text: 'Python ' + info.version.split(' ')[0] + '. Your files live in ' + HOME + ', so  import mymodule  works for mymodule.py.' }));
  }
}
async function renderStack() {
  if (panelOpen() !== 'stack') return;
  const p = $('#panel');
  if (state !== 'ready') return;
  const r = await call('stack_info');
  if (panelOpen() !== 'stack') return;
  p.textContent = '';
  const info = r ? JSON.parse(r) : { frames: [] };
  if (!info.exc) { p.append(el('div', { class: 'empty', text: 'The stack viewer shows where the last error happened and the variables in each function at that moment.' })); return; }
  p.append(el('div', { class: 'where' }, el('span', { class: 'k', text: info.exc })));
  for (const f of info.frames.reverse()) {
    p.append(el('div', { class: 'sec' }, el('button', { style: 'text-decoration:underline;font:inherit;letter-spacing:inherit;text-transform:none', onclick: () => goFileLine(f.file, f.line), text: `${f.func}  ·  ${f.file.replace(HOME + '/', '')}:${f.line}` })));
    p.append(el('pre', { class: 'doc', style: 'padding-top:0', text: f.src }));
    if (f.locals.length) p.append(varTable(f.locals));
  }
}
let docQuery = '';
function renderDocs() {
  const p = $('#panel'); p.textContent = '';
  const inp = el('input', { type: 'text', value: docQuery, placeholder: 'len, str.split, math, random.choice', 'aria-label': 'Name to look up', spellcheck: 'false', autocapitalize: 'off' });
  const go = () => docFor(inp.value);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  p.append(el('div', { class: 'search' }, inp, el('button', { class: 'btn', text: 'Look up', onclick: go })));
  const body = el('div', { id: 'docbody' });
  p.append(body);
  if (docQuery) showDoc(docQuery, body);
  else body.append(el('div', { class: 'empty', text: 'Type a name to see its documentation, or put the cursor on a word in the editor and press F1.' }));
}
async function docFor(q) {
  q = (q || '').trim();
  if (!q) return;
  docQuery = q;
  if (panelOpen() !== 'docs') showPanel('docs'); else renderDocs();
}
async function showDoc(q, body) {
  if (state !== 'ready') { body.append(el('div', { class: 'empty', text: 'Look-ups work while the program is idle.' })); return; }
  let r = await call('inspect_name', q);
  let info = r ? JSON.parse(r) : { err: 'nothing' };
  if (info.err && !q.includes('.')) {
    r = await call('inspect_name', `__import__('importlib').import_module(${JSON.stringify(q)})`);
    const i2 = r ? JSON.parse(r) : null;
    if (i2 && !i2.err) info = i2;
  }
  body.textContent = '';
  if (info.err) { body.append(el('div', { class: 'empty', text: `Nothing called ${q} here. Run your file first if it is one of yours, or import the module in the shell.` })); return; }
  body.append(el('div', { class: 'where' }, el('span', { class: 'k', text: q }), info.sig ? info.sig : '', el('span', { style: 'color:var(--graphite)', text: '  ' + info.type })));
  body.append(el('pre', { class: 'doc', text: info.doc || info.repr }));
  if (info.attrs && info.attrs.length) {
    body.append(el('div', { class: 'sec', text: 'Attributes' }));
    const wrap = el('div', { style: 'padding:0 14px 14px;display:flex;flex-wrap:wrap;gap:4px' });
    for (const a of info.attrs) wrap.append(el('button', { class: 'hb', style: 'font:12.5px var(--mono);border-color:var(--rule)', text: a, onclick: () => docFor(q + '.' + a) }));
    body.append(wrap);
  }
}
function renderCheats() {
  const p = $('#panel'); p.textContent = '';
  const c = el('div', { class: 'cheat' });
  c.append(el('div', { class: 'empty', style: 'padding-bottom:0', text: 'Tap a snippet to put it in the editor (or the shell, if you were typing there).' }));
  for (const [title, items] of PB.cheats) {
    c.append(el('h4', { text: title }));
    for (const s of items) { const pre = el('pre', { title: 'Insert', onclick: () => insertSnippet(s) }); highlight(s.split('\n')[0], pre); s.split('\n').slice(1).forEach((l) => { pre.append('\n'); highlight(l, pre); }); c.append(pre); }
  }
  p.append(c);
}
function insertSnippet(s) {
  const cm = lastCM || ed;
  if (cm === ed && cur && cur.ro) return;
  const c = cm.getCursor(), ind = cm.getLine(c.line).match(/^\s*/)[0];
  cm.replaceSelection(s.split('\n').join('\n' + (c.ch ? ind : '')));
  if (isMobile()) setView(cm === sh ? 'shell' : 'code');
  cm.focus();
}
function renderTools() {
  const p = $('#panel'); p.textContent = '';
  const g = el('div', { class: 'sheet' });
  const desc = { vars: 'Every variable and its value', debug: 'Step through line by line', outline: 'Classes and functions', files: 'Your files and sys.path', stack: 'Where the last error happened', docs: 'Documentation for any name', cheats: 'Snippets to insert', learn: 'Lessons with checks', turtle: 'Drawings' };
  for (const [id, name] of PANELS) if (!['learn', 'turtle'].includes(id)) g.append(el('button', { onclick: () => showPanel(id) }, name, el('small', { text: desc[id] })));
  p.append(g);
}

/* ---------- lessons */
const progress = store.get('progress', {});
let lessonId = store.get('lesson', null);
function renderLearn() {
  const p = $('#panel'); p.textContent = '';
  const L = PB.lessons.find((l) => l.id === lessonId);
  if (!L) {
    const done = PB.lessons.filter((l) => progress[l.id]).length;
    p.append(el('div', { class: 'prose' }, el('h2', { text: 'Lessons' }), el('p', { text: `${done} of ${PB.lessons.length} done. Each lesson ends with a small task that Pybench checks for you.` })));
    const ul = el('ul', { class: 'list lesson-list' });
    PB.lessons.forEach((l, i) => ul.append(el('li', { class: progress[l.id] ? 'done' : '' }, el('button', { onclick: () => { lessonId = l.id; store.set('lesson', l.id); renderLearn(); } }, el('span', { class: 'no', text: String(i + 1).padStart(2, '0') }), el('span', { text: l.title }), el('i', { class: 'tick' })))));
    p.append(ul);
    p.append(el('div', { class: 'sec', text: 'Examples' }));
    const ex = el('ul', { class: 'list' });
    for (const [title, code] of PB.examples) ex.append(el('li', {}, el('button', { onclick: () => openExample(title, code) }, el('span', { text: title }))));
    p.append(ex);
    return;
  }
  const idx = PB.lessons.indexOf(L);
  const pr = el('div', { class: 'prose' });
  p.append(el('div', { class: 'backlink' }, el('button', { style: 'text-decoration:underline', text: 'All lessons', onclick: () => { lessonId = null; store.set('lesson', null); renderLearn(); } }), `  ·  ${idx + 1} of ${PB.lessons.length}`), pr);
  pr.append(el('h2', { text: L.title }));
  for (const [k, v] of L.body) {
    if (k === 'p') pr.append(inlineCode(v));
    else {
      const pre = el('pre');
      v.split('\n').forEach((l, i) => { if (i) pre.append('\n'); highlight(l, pre); });
      pr.append(pre, el('button', { class: 'try', text: 'Run this in the shell', onclick: () => tryInShell(v) }));
    }
  }
  const T = L.task, fname = `lesson_${String(idx + 1).padStart(2, '0')}_${L.id}.py`;
  const verdict = el('div', { class: 'verdict', hidden: true });
  const hintBox = el('div', { class: 'verdict', hidden: true, text: T.hint });
  pr.append(el('div', { class: 'task' }, el('h3', { text: progress[L.id] ? 'Task: done' : 'Task' }), inlineCode(T.text),
    el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px' },
      el('button', { class: 'btn', text: files[fname] != null ? 'Open my answer' : 'Start', onclick: () => { if (files[fname] == null) { files[fname] = T.starter; persist(); } openTab(fname); ed.setCursor(ed.lastLine(), 0); ed.focus(); } }),
      el('button', { class: 'btn pri', text: 'Check', onclick: () => checkLesson(L, fname, verdict) }),
      el('button', { class: 'btn', text: 'Hint', onclick: () => { hintBox.hidden = !hintBox.hidden; } })),
    hintBox, verdict));
  if (idx < PB.lessons.length - 1) pr.append(el('button', { class: 'btn', style: 'margin-top:8px', text: 'Next: ' + PB.lessons[idx + 1].title, onclick: () => { lessonId = PB.lessons[idx + 1].id; store.set('lesson', lessonId); renderLearn(); $('#panel').scrollTop = 0; } }));
}
function inlineCode(text) {
  const pEl = el('p');
  text.split(/(`[^`]+`)/).forEach((part) => pEl.append(part.startsWith('`') ? el('code', { text: part.slice(1, -1) }) : part));
  return pEl;
}
async function tryInShell(code) {
  if (isMobile()) setView('shell');
  await whenReady();
  if (state !== 'ready') return status('Wait for the running program to finish.');
  submit(code);
}
function openExample(title, code) {
  const base = title.toLowerCase().replace(/^turtle: /, 'turtle_').replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
  const name = files[base + '.py'] == null ? base + '.py' : newName(base);
  files[name] = code; persist();
  openTab(name);
}
async function checkLesson(L, fname, verdict) {
  const t = tabs.find((x) => x.name === fname);
  const code = t ? t.doc.getValue() : files[fname];
  verdict.hidden = false; verdict.className = 'verdict'; verdict.textContent = 'Checking…';
  if (code == null) { verdict.textContent = 'Press Start first and write your answer in the editor.'; return; }
  if (t) saveTab(t);
  if (state === 'busy' || state === 'input' || state === 'paused') { Debug.done(); spawn(); }
  await whenReady();
  turtleSeen = false;
  if (L.id === 'turtle') Turtle.reset();
  const r = await exec({ t: 'lesson', code, check: L.task.check, stdin: L.task.stdin || [] });
  const res = r ? JSON.parse(r) : { ok: false, msg: 'The check was interrupted.' };
  verdict.textContent = '';
  if (res.ok) {
    verdict.className = 'verdict ok'; verdict.textContent = 'Correct. Nicely done.';
    progress[L.id] = Date.now(); store.set('progress', progress);
  } else {
    verdict.className = 'verdict no'; verdict.append(el('div', { text: res.msg }));
    if (res.hint) verdict.append(el('div', { style: 'color:var(--graphite);margin-top:4px', text: res.hint }));
  }
}

/* ================================================================ dialogs */
function modal(title, body, actions, wide) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const veil = el('div', { class: 'veil ui' });
    const done = (v) => { veil.remove(); document.removeEventListener('keydown', key, true); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const acts = el('div', { class: 'acts' });
    actions.forEach(([label, val, pri]) => acts.append(el('button', { class: 'btn' + (pri ? ' pri' : ''), text: label, onclick: () => done(typeof val === 'function' ? val() : val) })));
    const d = el('div', { class: 'dlg' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, el('h2', { text: title }), el('div', { class: 'body' }, body), acts);
    veil.append(d);
    veil.addEventListener('mousedown', (e) => { if (e.target === veil) done(null); });
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); const pri = actions.find((a) => a[2]); if (pri) done(typeof pri[1] === 'function' ? pri[1]() : pri[1]); }
    };
    document.addEventListener('keydown', key, true);
    document.body.append(veil);
    setTimeout(() => { const f = $('input,select,textarea', d) || $('.btn.pri', d) || $('.btn', d); if (f) { f.focus(); if (f.select) f.select(); } }, 0);
  });
}
function ask(title, label, value = '') {
  const inp = el('input', { type: 'text', value, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off' });
  return modal(title, el('label', { class: 'fld' }, el('span', { text: label }), inp), [['Cancel', null], ['OK', () => inp.value, true]]);
}
function choose(title, text, opts) {
  return modal(title, el('p', { style: 'margin:0', text }), opts.map((o, i) => [o, o, i === 0]));
}
function alertBox(title, text) { return modal(title, el('pre', { style: 'margin:0;white-space:pre-wrap;font:14px/1.5 var(--ui)', text }), [['OK', true, true]]); }

async function openDialog() {
  const body = el('div');
  const names = Object.keys(files).sort();
  const recent = store.get('recent', []).filter((n) => files[n] != null);
  const list = (arr) => { const ul = el('ul', { class: 'list' }); for (const n of arr) ul.append(el('li', {}, el('button', { onclick: () => { openTab(n); veilClose(); } }, el('span', { text: n })))); return ul; };
  if (recent.length) body.append(el('div', { class: 'sec', style: 'padding-left:0', text: 'Recent' }), list(recent.slice(0, 5)));
  body.append(el('div', { class: 'sec', style: 'padding-left:0', text: 'All files in this browser' }), names.length ? list(names) : el('div', { class: 'empty', text: 'No saved files.' }));
  let veilClose = () => {};
  const p = modal('Open', body, [['From this device…', () => { upload(); return null; }], ['Cancel', null, true]]);
  veilClose = () => { const v = $('.veil'); if (v) v.querySelector('.acts .btn.pri').click(); };
  return p;
}
async function openModule() {
  const name = await ask('Open module', 'Module name (for example random, json, turtle)', '');
  if (!name) return;
  await whenReady();
  if (state !== 'ready') return status('Wait for the running program to finish.');
  const r = JSON.parse(await call('module_source', name.trim()) || '{"err":"no reply"}');
  if (r.err) return alertBox('Open module', `Could not open ${name}.\n${r.err}`);
  const t = openTab(r.file, { text: r.src, ro: true });
  ed.setCursor(0, 0);
  void t;
}
async function findInFiles() {
  const q = await ask('Find in files', 'Search all files for', (ed.getSelection() || wordAt(ed) || '').split('\n')[0]);
  if (!q) return;
  const all = allFiles();
  restartLine(`Searching ${JSON.stringify(q)} in ${Object.keys(all).length} files`);
  let hits = 0;
  for (const [name, text] of Object.entries(all)) {
    text.split('\n').forEach((line, i) => {
      if (line.includes(q)) {
        hits++;
        outEl.append(el('span', { class: 'loc', text: `${name}: ${i + 1}:`, onclick: () => goFileLine(HOME + '/' + name, i + 1) }), el('span', { class: 'o', text: ' ' + line.trim() + '\n' }));
      }
    });
  }
  out(`${hits} hit${hits === 1 ? '' : 's'}.\n`, 'sys');
  if (isMobile()) setView('shell');
}
function settingsDialog() {
  const f = (label, input) => el('label', { class: 'fld' }, el('span', { text: label }), input);
  const cb = (k) => el('input', { type: 'checkbox', checked: S[k], 'data-k': k });
  const body = el('div',
    f('Theme', el('select', { 'data-k': 'theme' }, el('option', { value: 'paper', text: 'Paper', selected: S.theme === 'paper' }), el('option', { value: 'night', text: 'Night', selected: S.theme === 'night' }))),
    f('Font size', el('input', { type: 'number', min: 10, max: 28, value: S.font, 'data-k': 'font' })),
    f('Indent width', el('input', { type: 'number', min: 2, max: 16, value: S.indent, 'data-k': 'indent' })),
    f('Line numbers', cb('lines')), f('Code context', cb('context')), f('Close brackets for me', cb('brackets')),
    f('Live syntax check', cb('live')), f('Completion popup after a dot', cb('popup')), f('Explain errors in plain words', cb('friendly')),
    f('Open the stack viewer on errors', cb('autostack')));
  return modal('Configure Pybench', body, [['Cancel', null], ['Apply', () => {
    for (const i of $$('[data-k]', body)) S[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? +i.value : i.value;
    S.font = Math.max(10, Math.min(28, S.font || 15)); S.indent = Math.max(2, Math.min(16, S.indent || 4));
    applySettings(); return true;
  }, true]]);
}
function helpDialog() {
  const rows = [
    ['Files', [['Ctrl+Alt+N', 'New file'], ['Ctrl+O', 'Open'], ['Alt+M', 'Open a standard library module (read only)'], ['Ctrl+S', 'Save'], ['Ctrl+Shift+S', 'Save as'], ['Alt+C', 'Module browser (Outline)']]],
    ['Running', [['F5', 'Run module: restarts Python, runs the file, keeps its variables in the shell'], ['Shift+F5', 'Run with command-line arguments'], ['Alt+X', 'Check module for syntax errors'], ['Ctrl+C', 'Interrupt (in the shell, when nothing is selected)'], ['Ctrl+F6', 'Restart the shell'], ['F6', 'Scroll to the last restart']]],
    ['Shell', [['Enter', 'Run the line. Blocks (if, for, def) continue until an empty line'], ['Ctrl+Enter', 'Run everything typed so far'], ['Shift+Enter', 'New line without running'], ['Alt+P / Alt+N', 'Previous / next history (also Up / Down)'], ['Ctrl+L', 'Clear the shell']]],
    ['Editing', [['Tab', 'Complete a name, or indent'], ['Ctrl+Space', 'Show completions'], ['Ctrl+\\', 'Show call tip'], ['Alt+/', 'Expand word'], ['Ctrl+0', 'Show surrounding parentheses'], ['F1', 'Documentation for the word at the cursor'], ['Ctrl+] / Ctrl+[', 'Indent / dedent region'], ['Alt+3 / Alt+4', 'Comment / uncomment region'], ['Alt+5 / Alt+6', 'Tabify / untabify region'], ['Alt+Q', 'Format paragraph'], ['Alt+T', 'Toggle tabs'], ['Alt+U', 'New indent width'], ['Alt+G', 'Go to line']]],
    ['Searching', [['Ctrl+F', 'Find'], ['Ctrl+G', 'Find again'], ['Ctrl+F3', 'Find selection'], ['Alt+F3', 'Find in files'], ['Ctrl+H', 'Replace']]],
    ['Debugger', [['Debug > Debugger', 'Run (F5) now stops at the first line'], ['Gutter click', 'Set or clear a breakpoint'], ['F11 / F10 / Shift+F11', 'Step / over / out'], ['F8', 'Go to the next breakpoint']]],
  ];
  const body = el('div');
  for (const [h, items] of rows) {
    body.append(el('h3', { class: 'keytable', style: 'font:700 11px var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--graphite);margin:12px 0 4px', text: h }));
    const tb = el('table', { class: 'keytable' });
    for (const [k, v] of items) tb.append(el('tr', {}, el('td', { text: k }), el('td', { text: v })));
    body.append(tb);
  }
  body.append(el('p', { style: 'margin:14px 0 0;color:var(--graphite)', text: 'On a Mac, use Cmd where it says Ctrl for save and open; Alt is Option.' }));
  return modal('Pybench help', body, [['Close', null, true]], true);
}
function aboutDialog() {
  return alertBox('About Pybench', `Pybench is a Python workbench modelled on IDLE, the editor that ships with Python.\n\nIt runs real CPython ${version || '3.12'} compiled to WebAssembly (Pyodide) entirely in your browser: nothing you write leaves this device. Files are kept in this browser's storage; download them to keep a copy.\n\nThe standard library is included (math, random, json, datetime, turtle and more). Packages from pip are not.`);
}
function shareLink() {
  if (!cur) return;
  const b = btoa(unescape(encodeURIComponent(cur.doc.getValue()))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = location.origin + location.pathname + '#code=' + b + '&name=' + encodeURIComponent(cur.name);
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => status('Link copied. Anyone who opens it gets this file.'), () => ask('Share link', 'Copy this link', url));
}
function printFile() {
  if (!cur) return;
  const pre = el('pre', { id: 'printout', style: 'font:11pt/1.4 var(--mono);white-space:pre-wrap;margin:0' });
  pre.textContent = '# ' + cur.name + '\n\n' + cur.doc.getValue();
  const st = el('style', { text: '@media print{body>*:not(#printout){display:none!important}body{display:block!important;height:auto!important;overflow:visible!important}}@media screen{#printout{display:none}}' });
  document.body.append(pre, st);
  window.print();
  setTimeout(() => { pre.remove(); st.remove(); }, 500);
}

/* ================================================================ menus */
let openMenu = null;
const kb = (s) => s;
function menuData() {
  const tabItems = tabs.map((t) => [t.name, null, () => activate(t), t === cur]);
  return [
    ['File', [
      ['New File', kb('Ctrl+Alt+N'), newFile], ['Open…', 'Ctrl+O', openDialog], ['Open Module…', 'Alt+M', openModule], ['Upload from device…', null, upload], '-',
      ['Module Browser', 'Alt+C', () => showPanel('outline')], ['Path Browser', null, () => showPanel('files')], '-',
      ['Save', 'Ctrl+S', () => (cur && cur.name.startsWith('untitled') && files[cur.name] == null ? saveAs() : saveTab())], ['Save As…', 'Ctrl+Shift+S', () => saveAs()],
      ['Save Copy As… (download)', null, () => cur && download(cur.name, cur.doc.getValue())], ['Share link', null, shareLink], '-',
      ['Print Window', 'Ctrl+P', printFile], ['Close Tab', null, () => cur && closeTab(cur)], ['Back to the arcade', null, () => { location.href = '../'; }]]],
    ['Edit', [
      ['Undo', 'Ctrl+Z', () => (lastCM || ed).undo()], ['Redo', 'Ctrl+Shift+Z', () => (lastCM || ed).redo()], '-',
      ['Cut', 'Ctrl+X', () => clip('cut')], ['Copy', 'Ctrl+C', () => clip('copy')], ['Paste', 'Ctrl+V', () => clip('paste')], ['Select All', 'Ctrl+A', () => (lastCM || ed).execCommand('selectAll')], '-',
      ['Find…', 'Ctrl+F', () => ed.execCommand('find')], ['Find Again', 'Ctrl+G', () => ed.execCommand('findNext')], ['Find Selection', 'Ctrl+F3', () => findSelection(ed)],
      ['Find in Files…', 'Alt+F3', findInFiles], ['Replace…', 'Ctrl+H', () => ed.execCommand('replace')], ['Go to Line', 'Alt+G', gotoLine], '-',
      ['Show Completions', 'Ctrl+Space', () => { const cm = lastCM || ed; cm.focus(); cm.showHint({ hint: pyHint, completeSingle: false }); }], ['Expand Word', 'Alt+/', () => expandWord(ed)],
      ['Show Call Tip', 'Ctrl+\\', () => callTip(lastCM || ed, true)], ['Show Surrounding Parens', 'Ctrl+0', () => surroundingParens(ed)]]],
    ['Format', [
      ['Format Paragraph', 'Alt+Q', () => formatParagraph(ed)], ['Indent Region', 'Ctrl+]', () => ed.execCommand('indentMore')], ['Dedent Region', 'Ctrl+[', () => ed.execCommand('indentLess')],
      ['Comment Out Region', 'Alt+3', () => commentRegion(ed, true)], ['Uncomment Region', 'Alt+4', () => commentRegion(ed, false)],
      ['Tabify Region', 'Alt+5', () => tabifyRegion(ed, true)], ['Untabify Region', 'Alt+6', () => tabifyRegion(ed, false)],
      ['Toggle Tabs', 'Alt+T', toggleTabs, S.tabs], ['New Indent Width', 'Alt+U', newIndentWidth], ['Strip Trailing Whitespace', null, stripTrailing]]],
    ['Run', [['Run Module', 'F5', () => runModule()], ['Run… Customized', 'Shift+F5', runCustom], ['Check Module', 'Alt+X', checkModule], ['Python Shell', null, () => { if (isMobile()) setView('shell'); sh.focus(); }]]],
    ['Shell', [['View Last Restart', 'F6', viewLastRestart], ['Restart Shell', 'Ctrl+F6', () => restart()], '-', ['Previous History', 'Alt+P', () => { sh.focus(); histMove(-1); }], ['Next History', 'Alt+N', () => { sh.focus(); histMove(1); }], '-',
      ['Interrupt Execution', 'Ctrl+C', interrupt], ['Clear Shell', 'Ctrl+L', clearShell]]],
    ['Debug', [['Go to File/Line', null, () => lastErr && goFileLine(lastErr.file, lastErr.line)], ['Debugger', null, () => { S.debug = !S.debug; saveS(); showPanel('debug'); }, S.debug],
      ['Stack Viewer', null, () => showPanel('stack')], ['Auto-open Stack Viewer', null, () => { S.autostack = !S.autostack; saveS(); }, S.autostack], '-',
      ['Step', 'F11', () => Debug.cmd('step')], ['Over', 'F10', () => Debug.cmd('over')], ['Out', 'Shift+F11', () => Debug.cmd('out')], ['Go', 'F8', () => Debug.cmd('go')], ['Quit Debugging', null, () => Debug.cmd('quit')], '-',
      ['Clear All Breakpoints', null, clearBps]]],
    ['Options', [['Configure Pybench…', null, settingsDialog], '-', ['Show Code Context', null, () => { S.context = !S.context; applySettings(); }, S.context],
      ['Show Line Numbers', null, () => { S.lines = !S.lines; applySettings(); }, S.lines], ['Night Theme', null, () => { S.theme = S.theme === 'night' ? 'paper' : 'night'; applySettings(); }, S.theme === 'night'],
      ['Explain Errors', null, () => { S.friendly = !S.friendly; applySettings(); }, S.friendly], ['Live Syntax Check', null, () => { S.live = !S.live; applySettings(); }, S.live], '-',
      ['Zoom In', 'Ctrl+=', () => zoom(1)], ['Zoom Out', 'Ctrl+-', () => zoom(-1)]]],
    ['Window', [['Editor', null, () => { if (isMobile()) setView('code'); ed.focus(); }], ['Shell', null, () => { if (isMobile()) setView('shell'); sh.focus(); }], '-', ...tabItems]],
    ['Help', [['About Pybench', null, aboutDialog], ['Pybench Help', null, helpDialog], ['Python Docs', 'F1', () => window.open('https://docs.python.org/3.12/', '_blank', 'noopener')], '-',
      ['Lessons', null, () => showPanel('learn')], ['Cheat Sheet', null, () => showPanel('cheats')], '-', ...PB.examples.map(([t, code]) => [t.startsWith('Turtle') ? t.replace('Turtle: ', 'Turtle Demo: ') : 'Example: ' + t, null, () => openExample(t, code)])]],
  ];
}
function menuItems(items, close) {
  const box = [];
  for (const it of items) {
    if (it === '-') { box.push(el('div', { class: 'msep', role: 'separator' })); continue; }
    const [label, key, fn, checked] = it;
    const b = el('button', { class: 'mi', role: checked !== undefined ? 'menuitemcheckbox' : 'menuitem', 'aria-checked': checked !== undefined ? String(!!checked) : null, onclick: () => { close(); fn(); } }, el('span', { text: label }), key ? el('span', { class: 'kb', text: key }) : null);
    box.push(b);
  }
  return box;
}
function closeMenus() {
  if (openMenu) { openMenu.menu.remove(); openMenu.btn.setAttribute('aria-expanded', 'false'); openMenu = null; }
}
function buildMenus() {
  const nav = $('#menus');
  nav.textContent = '';
  for (const [title] of menuData()) {
    const b = el('button', { class: 'mt', role: 'menuitem', 'aria-haspopup': 'true', 'aria-expanded': 'false', text: title });
    b.addEventListener('click', () => (openMenu && openMenu.btn === b ? closeMenus() : showMenu(b, title)));
    b.addEventListener('mouseenter', () => { if (openMenu && openMenu.btn !== b) showMenu(b, title); });
    nav.append(b);
  }
}
function showMenu(btn, title) {
  closeMenus();
  const items = menuData().find((m) => m[0] === title)[1];
  const m = el('div', { class: 'menu ui', role: 'menu' }, menuItems(items, closeMenus));
  const r = btn.getBoundingClientRect();
  m.style.left = Math.min(r.left, innerWidth - 270) + 'px';
  $('header').append(m);
  btn.setAttribute('aria-expanded', 'true');
  openMenu = { btn, menu: m };
  m.addEventListener('keydown', (e) => {
    const its = $$('.mi', m), i = its.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); its[(i + 1) % its.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const tb = $$('.mt'); const j = tb.indexOf(btn); const nb = tb[(j + (e.key === 'ArrowRight' ? 1 : -1) + tb.length) % tb.length]; showMenu(nb, nb.textContent); $('.mi', openMenu.menu).focus(); }
  });
}
function mobileMenu() {
  if (openMenu) return closeMenus();
  const btn = $('#mmenu');
  const m = el('div', { class: 'menu ui', role: 'menu' });
  for (const [title, items] of menuData()) {
    const keep = items.filter((x) => x === '-' || !/^(Print|Cut|Copy|Paste|Select All|Zoom)/.test(x[0])).filter((x, i, arr) => x !== '-' || (i > 0 && arr[i - 1] !== '-' && i < arr.length - 1));
    m.append(el('div', { class: 'mgroup', text: title }), ...menuItems(keep, closeMenus));
  }
  $('header').append(m);
  btn.setAttribute('aria-expanded', 'true');
  openMenu = { btn, menu: m };
}
$('#mmenu').addEventListener('click', mobileMenu);
document.addEventListener('mousedown', (e) => { if (openMenu && !e.target.closest('.menu') && !e.target.closest('.mt') && !e.target.closest('#mmenu')) closeMenus(); });
document.addEventListener('touchstart', (e) => { if (openMenu && !e.target.closest('.menu') && !e.target.closest('#mmenu')) closeMenus(); }, { passive: true });
async function clip(kind) {
  const cm = lastCM || ed;
  if (kind === 'paste') { try { const t = await navigator.clipboard.readText(); cm.replaceSelection(t); } catch (e) { status('Use Ctrl+V to paste.'); } cm.focus(); return; }
  const t = cm.getSelection();
  if (!t) return;
  try { await navigator.clipboard.writeText(t); } catch (e) { document.execCommand(kind); }
  if (kind === 'cut') cm.replaceSelection('');
  cm.focus();
}
function viewLastRestart() {
  const r = $$('.restart', outEl).pop();
  if (isMobile()) setView('shell');
  if (r) shellEl.scrollTop = r.offsetTop - 8;
}
function zoom(d) { S.font = Math.max(10, Math.min(28, S.font + d)); applySettings(); }

/* ================================================================ settings, layout, mobile */
function applySettings() {
  saveS();
  document.documentElement.dataset.theme = S.theme;
  $('meta[name=theme-color]').content = S.theme === 'night' ? '#1a1916' : '#f3eee3';
  document.documentElement.style.setProperty('--fs', S.font + 'px');
  ed.setOption('lineNumbers', S.lines);
  for (const cm of [ed, sh]) { cm.setOption('indentUnit', S.indent); cm.setOption('tabSize', S.indent); cm.setOption('autoCloseBrackets', S.brackets); }
  ed.setOption('indentWithTabs', S.tabs);
  ed.refresh(); sh.refresh();
  codeContext();
  if (!S.live && cur) { cur.err = null; paintErr(); } else liveCheck();
  buildMenus();
  if (panelOpen() === 'turtle') Turtle.redraw();
}
function applySplit() {
  if (isMobile()) { $('#main').style.gridTemplateColumns = ''; return; }
  const a = S.split, side = sideOpen ? 'var(--side)' : '0';
  $('#main').style.gridTemplateColumns = `minmax(0,${a}fr) 6px minmax(0,${1 - a}fr) var(--rail) ${side}`;
}
(() => {
  const sp = $('#split');
  let drag = null;
  sp.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, a: S.split, w: $('#edpane').offsetWidth + $('#shpane').offsetWidth }; sp.setPointerCapture(e.pointerId); });
  sp.addEventListener('pointermove', (e) => { if (!drag) return; S.split = Math.max(0.2, Math.min(0.8, drag.a + (e.clientX - drag.x) / drag.w)); applySplit(); });
  sp.addEventListener('pointerup', () => { if (drag) { drag = null; saveS(); ed.refresh(); sh.refresh(); } });
  sp.addEventListener('dblclick', () => { S.split = 0.53; applySplit(); saveS(); });
})();
const sideObs = new MutationObserver(() => { applySplit(); setTimeout(() => { ed.refresh(); sh.refresh(); }, 0); });
sideObs.observe($('#main'), { attributes: true, attributeFilter: ['class'] });

function setView(v) {
  const m = $('#main');
  m.dataset.view = v;
  renderMnav();
  if (v === 'code') setTimeout(() => ed.refresh(), 0);
  if (v === 'shell') setTimeout(() => { sh.refresh(); scrollDown(true); }, 0);
  if (v === 'side' && !$('#panel').childElementCount) showPanel(panel);
  if (v === 'side' && panel === 'turtle') Turtle.redraw();
}
function renderMnav() {
  const n = $('#mnav');
  const v = $('#main').dataset.view;
  const items = [['code', 'Code'], ['shell', 'Shell'], ['learn', 'Learn'], ['turtle', 'Turtle'], ['tools', 'Tools']];
  n.textContent = '';
  for (const [id, label] of items) {
    const sel = id === v || (v === 'side' && (id === panel || (id === 'tools' && !['learn', 'turtle'].includes(panel))));
    n.append(el('button', { 'aria-selected': sel ? 'true' : 'false', text: label, onclick: () => { if (id === 'code' || id === 'shell') setView(id); else showPanel(id); } }));
  }
}
/* accessory key row above the on-screen keyboard */
let keysTarget = null, keysHide = 0;
function keysFor(cm) {
  if (!isMobile()) return;
  clearTimeout(keysHide);
  keysTarget = cm;
  const k = $('#keys');
  k.textContent = '';
  const ins = (s, back = 0) => () => { cm.replaceSelection(s); if (back) { const c = cm.getCursor(); cm.setCursor({ line: c.line, ch: c.ch - back }); } };
  const keys = [
    ['tab', () => smartTab(cm), 'w'], ['untab', () => cm.execCommand('indentLess'), 'w'],
    [':', ins(':')], ['( )', ins('()', 1)], ['[ ]', ins('[]', 1)], ['" "', ins('""', 1)], ["'", ins("'")], ['=', ins('=')], ['.', ins('.')], ['_', ins('_')], ['#', ins('#')], ['+', ins('+')], ['-', ins('-')], ['*', ins('*')], ['{ }', ins('{}', 1)],
    ['◀', () => cm.execCommand('goCharLeft')], ['▶', () => cm.execCommand('goCharRight')],
  ];
  if (cm === sh) keys.splice(2, 0, ['↑', () => histMove(-1)], ['↓', () => histMove(1)]);
  for (const [label, fn, cls] of keys) {
    const b = el('button', { class: cls || '', text: label, 'aria-label': label });
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); });
    b.addEventListener('click', (e) => e.preventDefault());
    k.append(b);
  }
  const run = el('button', { class: 'w pri', text: cm === sh ? 'Enter' : 'Run' });
  run.addEventListener('pointerdown', (e) => { e.preventDefault(); if (cm === sh) shellEnter(sh); else { cm.getInputField().blur(); runModule(); } });
  k.prepend(run);
  k.classList.add('on');
  $('#mnav').classList.add('kb');
}
function keysBlur() {
  clearTimeout(keysHide);
  keysHide = setTimeout(() => { if (!ed.hasFocus() && !sh.hasFocus()) { $('#keys').classList.remove('on'); $('#mnav').classList.remove('kb'); } }, 150);
}
if (window.visualViewport) {
  const vv = visualViewport;
  const fit = () => { if (!isMobile()) { document.body.style.height = ''; return; } document.body.style.height = vv.height + 'px'; window.scrollTo(0, 0); };
  vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
}
/* app mode on touch screens: no pinch, no double-tap zoom, no long-press menus outside text */
['gesturestart', 'gesturechange'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => { if (!e.target.closest('.CodeMirror,#out,input,textarea')) e.preventDefault(); });

/* ================================================================ global keys */
document.addEventListener('keydown', (e) => {
  if ($('.veil')) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key, code = e.code;
  const hit = (f) => { e.preventDefault(); e.stopPropagation(); closeMenus(); f(); };
  if (k === 'Escape' && openMenu) return hit(closeMenus);
  if (k === 'F5' && !e.shiftKey && !ctrl) return hit(() => runModule());
  if (k === 'F5' && e.shiftKey) return hit(runCustom);
  if (k === 'F6' && ctrl) return hit(() => restart());
  if (k === 'F6') return hit(viewLastRestart);
  if (state === 'paused') {
    if (k === 'F11' && e.shiftKey) return hit(() => Debug.cmd('out'));
    if (k === 'F11') return hit(() => Debug.cmd('step'));
    if (k === 'F10') return hit(() => Debug.cmd('over'));
    if (k === 'F8') return hit(() => Debug.cmd('go'));
  }
  if (e.altKey && !ctrl && code === 'KeyX') return hit(checkModule);
  if (e.altKey && !ctrl && code === 'KeyM') return hit(openModule);
  if (e.altKey && !ctrl && code === 'KeyC') return hit(() => showPanel('outline'));
  if (e.altKey && !ctrl && k === 'F3') return hit(findInFiles);
  if (ctrl && e.altKey && code === 'KeyN') return hit(newFile);
  if (ctrl && !e.altKey && code === 'KeyS') return hit(() => (e.shiftKey ? saveAs() : cur && cur.name.startsWith('untitled') && files[cur.name] == null ? saveAs() : saveTab()));
  if (ctrl && !e.altKey && code === 'KeyO') return hit(openDialog);
  if (ctrl && !e.altKey && code === 'KeyP') return hit(printFile);
  if (ctrl && code === 'KeyL' && !ed.hasFocus()) return hit(clearShell);
  if (ctrl && (k === '=' || k === '+')) return hit(() => zoom(1));
  if (ctrl && k === '-') return hit(() => zoom(-1));
  if (ctrl && code === 'KeyC' && !e.shiftKey && state !== 'ready' && state !== 'load' && !String(getSelection()) && !(lastCM && lastCM.somethingSelected())) return hit(interrupt);
}, true);
$('#runbtn').addEventListener('click', () => runModule());
for (const b of $$('[data-act]')) b.addEventListener('click', () => ({ interrupt, restart: () => restart(), clearshell: clearShell }[b.dataset.act]()));
window.addEventListener('beforeunload', () => saveDrafts());

/* ================================================================ boot */
function restoreTabs() {
  const open = store.get('open', null) || Object.keys(files).slice(0, 1);
  for (const n of open) if (files[n] != null || drafts[n] != null) openTab(n, { text: files[n] != null ? files[n] : '', dirtyText: drafts[n] });
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('code')) {
    try {
      const txt = decodeURIComponent(escape(atob(hash.get('code').replace(/-/g, '+').replace(/_/g, '/'))));
      const nm = newName((hash.get('name') || 'shared').replace(/\.py$/, '').replace(/[^\w-]/g, '_'));
      openTab(nm, { text: '', dirtyText: txt });
      history.replaceState(null, '', location.pathname);
    } catch (e) {}
  }
  if (!tabs.length) openTab(Object.keys(files)[0] || newName());
  const act = store.get('active', null);
  const t = !hash.get('code') && tabs.find((x) => x.name === act);
  if (t) activate(t);
}
applySettings();
restoreTabs();
renderRail();
if (isMobile()) { $('#main').dataset.view = 'code'; renderMnav(); }
else { if (!sideOpen) $('#main').classList.add('noside'); showPanel(panel); }
applySplit();
matchMedia('(max-width: 899px)').addEventListener('change', () => { applySplit(); ed.setOption('lineWrapping', isMobile()); if (!isMobile()) { $('#keys').classList.remove('on'); $('#mnav').classList.remove('kb'); document.body.style.height = ''; showPanel(panel); } else { setView('code'); } ed.refresh(); sh.refresh(); });
spawn();
window.PYB = { ed, sh, get state() { return state; }, runModule, submit, files: () => files, tabs: () => tabs, Turtle, showPanel, setView };
})();
