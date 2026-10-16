#!/usr/bin/env python3
"""Build public/python/data.js from tools/pyref/content/*.txt.

Every ```py block is compiled, and run unless marked otherwise. A ```text block
right after a run block must match what the example really prints.
  ```py            run it; must exit 0 with no stderr
  ```py norun      compile only (needs network, blocks forever, etc.)
  ```py bad        a deliberately broken example; not checked
  ```py raises     run it; must fail (shows an error on purpose)
  ```text / ```sh  shown as-is
tkinter examples run under a virtual display; mainloop closes itself and
dialogs return a dummy answer, so a window that opens without errors passes.

Usage: python3 build.py [--py /path/to/python-with-tk] [--norun] [--only ID]
"""
import html, json, os, re, subprocess, sys, tempfile, keyword, io, tokenize, unicodedata, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'public', 'python', 'data.js')

RUNNER = r'''
import sys, builtins, runpy, os
_seq = ['5', 'quit', 'q', 'no', 'exit', 'n', '0', 'stop', '', 'done']
_seen = {}
_calls = [0]
def _input(prompt=''):
    print(prompt, end='')
    _calls[0] += 1
    if _calls[0] > 40:
        raise EOFError('example asked for input too many times')
    k = _seen.get(prompt, 0)
    _seen[prompt] = k + 1
    return _seq[k % len(_seq)]
builtins.input = _input
try:
    import tkinter
    from tkinter import messagebox, filedialog, simpledialog, colorchooser
    _ml = tkinter.Misc.mainloop
    def mainloop(self, n=0):
        root = self._root()
        root.after(int(os.environ.get('TK_MS', '350')), root.destroy)
        _ml(self, n)
    tkinter.Misc.mainloop = mainloop
    for name in dir(messagebox):
        if name.startswith(('show', 'ask')):
            setattr(messagebox, name, lambda *a, **k: True)
    filedialog.askopenfilename = lambda *a, **k: ''
    filedialog.asksaveasfilename = lambda *a, **k: ''
    filedialog.askdirectory = lambda *a, **k: ''
    filedialog.askopenfilenames = lambda *a, **k: ()
    filedialog.askopenfile = lambda *a, **k: None
    filedialog.asksaveasfile = lambda *a, **k: None
    simpledialog.askstring = lambda *a, **k: 'Sam'
    simpledialog.askinteger = lambda *a, **k: 5
    simpledialog.askfloat = lambda *a, **k: 2.5
    colorchooser.askcolor = lambda *a, **k: ((255, 0, 0), '#ff0000')
    tkinter.Misc.wait_window = lambda self, w=None: None
except ImportError:
    pass
sys.argv = [sys.argv[1]]
runpy.run_path(sys.argv[0], run_name='__main__')
'''

# ---------------------------------------------------------------- highlighting
BROKEN = set()
MISMATCH = []
BUILTINS = set('print input len range int str float list dict set tuple bool open type isinstance enumerate zip sorted reversed sum min max abs round map filter any all super object id hash iter next repr format chr ord divmod pow help dir vars getattr setattr hasattr exit quit'.split())

def hl_py(src):
    out = []
    try:
        toks = list(tokenize.generate_tokens(io.StringIO(src).readline))
    except (tokenize.TokenError, IndentationError, SyntaxError):
        return html.escape(src)
    lines = src.splitlines(keepends=True)
    offs = [0]
    for ln in lines:
        offs.append(offs[-1] + len(ln))
    pos = 0
    prev = None
    for t in toks:
        if t.type in (tokenize.ENDMARKER,):
            break
        (sr, sc), (er, ec) = t.start, t.end
        if sr - 1 >= len(offs):
            break
        a = offs[sr - 1] + sc
        b = offs[er - 1] + ec if er - 1 < len(offs) else len(src)
        if a > pos:
            out.append(html.escape(src[pos:a]))
        text = src[a:b]
        cls = None
        if t.type == tokenize.COMMENT:
            cls = 'c'
        elif t.type == tokenize.STRING or (hasattr(tokenize, 'FSTRING_START') and t.type in (tokenize.FSTRING_START, tokenize.FSTRING_MIDDLE, tokenize.FSTRING_END)):
            cls = 's'
        elif t.type == tokenize.NUMBER:
            cls = 'n'
        elif t.type == tokenize.NAME:
            if keyword.iskeyword(text) or text in ('self',):
                cls = 'k'
            elif prev in ('def', 'class'):
                cls = 'f'
            elif text in BUILTINS:
                cls = 'b'
        if cls:
            out.append('<i class="%s">%s</i>' % (cls, html.escape(text)))
        else:
            out.append(html.escape(text))
        pos = b
        if t.type == tokenize.NAME:
            prev = text
        elif t.type not in (tokenize.NL, tokenize.NEWLINE, tokenize.INDENT, tokenize.DEDENT):
            prev = None
    out.append(html.escape(src[pos:]))
    return ''.join(out)

# ---------------------------------------------------------------- markdown subset
def inline(s, ids):
    parts = re.split(r'(`[^`]+`)', s)
    res = []
    for p in parts:
        if p.startswith('`') and p.endswith('`') and len(p) > 1:
            res.append('<code>%s</code>' % html.escape(p[1:-1]))
            continue
        p = html.escape(p, quote=False)
        p = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', p)
        def link(m):
            target, label = m.group(1), m.group(2)
            if target not in ids:
                BROKEN.add(target)
                return '<a href="#/a/%s">%s</a>' % (target, label or target)
            return '<a href="#/a/%s">%s</a>' % (target, label or ids[target])
        p = re.sub(r'\[\[([\w.-]+)(?:\|([^\]]+))?\]\]', link, p)
        p = re.sub(r'\[(https?://[^\s\]]+) ([^\]]+)\]', r'<a href="\1" target="_blank" rel="noopener">\2</a>', p)
        res.append(p)
    return ''.join(res)

def render(body, ids):
    """Returns (html, blocks) where blocks = [(mode, code)]."""
    out, blocks = [], []
    lines = body.split('\n')
    i = 0
    para, lst = [], None
    last_was_py = False
    def flush():
        nonlocal para, lst
        if para:
            out.append('<p>%s</p>' % inline(' '.join(para), ids))
            para = []
        if lst is not None:
            tag = lst[0]
            out.append('<%s>%s</%s>' % (tag, ''.join('<li>%s</li>' % inline(x, ids) for x in lst[1]), tag))
            lst = None
    while i < len(lines):
        ln = lines[i]
        m = re.match(r'^```(\w+)?\s*(.*)$', ln)
        if m:
            flush()
            lang, mode = (m.group(1) or 'text'), (m.group(2).strip() or 'run')
            j = i + 1
            code = []
            while j < len(lines) and not lines[j].startswith('```'):
                code.append(lines[j])
                j += 1
            if j >= len(lines):
                raise SystemExit('unclosed code block: ' + ln)
            src = '\n'.join(code)
            label = {'bad': 'wrong', 'raises': 'error'}.get(mode, '')
            if lang == 'py':
                blocks.append([mode, src, None])
                inner = hl_py(src)
            else:
                inner = html.escape(src)
                if lang == 'text' and blocks and last_was_py and blocks[-1][2] is None:
                    blocks[-1][2] = src
            cls = 'code' + (' bad' if mode == 'bad' else '') + (' out' if lang == 'text' else '') + (' sh' if lang == 'sh' else '')
            tag = {'text': 'output', 'sh': 'terminal'}.get(lang, label)
            out.append('<figure class="%s"%s><pre>%s</pre></figure>' % (cls, (' data-tag="%s"' % tag) if tag else '', inner))
            last_was_py = lang == 'py'
            i = j + 1
            continue
        if not ln.strip():
            flush(); i += 1; continue
        last_was_py = False
        if ln.startswith('> '):
            flush()
            q = [ln[2:]]
            i += 1
            while i < len(lines) and lines[i].startswith('> '):
                q.append(lines[i][2:]); i += 1
            out.append('<aside>%s</aside>' % inline(' '.join(q), ids))
            continue
        if ln.startswith('### '):
            flush(); out.append('<h3>%s</h3>' % inline(ln[4:], ids)); i += 1; continue
        mo = re.match(r'^(-|\d+\.) (.*)$', ln)
        if mo:
            if para:
                out.append('<p>%s</p>' % inline(' '.join(para), ids)); para = []
            tag = 'ul' if mo.group(1) == '-' else 'ol'
            if lst is None or lst[0] != tag:
                if lst is not None:
                    flush()
                lst = (tag, [])
            lst[1].append(mo.group(2))
            i += 1
            continue
        if lst is not None and ln.startswith('  '):
            lst[1][-1] += ' ' + ln.strip(); i += 1; continue
        if lst is not None:
            flush()
        para.append(ln.strip())
        i += 1
    flush()
    return ''.join(out), blocks

# ---------------------------------------------------------------- parsing
def parse():
    sections, entries = [], []
    files = sorted(f for f in os.listdir(os.path.join(HERE, 'content')) if f.endswith('.txt'))
    for fn in files:
        text = open(os.path.join(HERE, 'content', fn), encoding='utf-8').read()
        for n, ln in enumerate(text.split('\n'), 1):
            bad = [c for c in ln if unicodedata.category(c) in ('Cf', 'Mn', 'Cc') and c != '\t']
            if bad:   # invisible characters: write them as \u escapes instead
                raise SystemExit('%s:%d: invisible character U+%04X' % (fn, n, ord(bad[0])))
        cur = None
        chunks, buf, fence = [], [], False
        for ln in text.split('\n'):
            if ln.startswith('```'):
                fence = not fence
            if not fence and (ln.startswith('# ') or ln.startswith('@@ ')) and buf:
                chunks.append('\n'.join(buf)); buf = []
            buf.append(ln)
        chunks.append('\n'.join(buf))
        for chunk in chunks:
            if chunk.startswith('# '):
                head = chunk.split('\n', 1)[0][2:]
                sid, title, blurb, group = [x.strip() for x in head.split('|')]
                cur = {'id': sid, 'title': title, 'blurb': blurb, 'group': group}
                sections.append(cur)
            elif chunk.startswith('@@ '):
                lines = chunk.rstrip().split('\n')
                e = {'id': lines[0][3:].strip(), 's': cur['id'], 'aka': '', 'err': ''}
                k = 1
                while k < len(lines) and re.match(r'^(Q|A|aka|err|see):', lines[k]):
                    key, val = lines[k].split(':', 1)
                    e[key] = val.strip()
                    k += 1
                e['body'] = '\n'.join(lines[k:]).strip()
                for need in ('Q', 'A'):
                    if need not in e:
                        raise SystemExit('%s missing %s' % (e['id'], need))
                entries.append(e)
    seen = set()
    for e in entries:
        if e['id'] in seen:
            raise SystemExit('duplicate id ' + e['id'])
        seen.add(e['id'])
    return sections, entries

def plain(s):
    s = re.sub(r'<[^>]+>', ' ', s)
    return html.unescape(re.sub(r'\s+', ' ', s)).strip()

def run_block(py, mode, src, expect, idx, eid):
    if mode in ('bad', 'norun'):
        if mode == 'norun':
            try:
                compile(src, eid, 'exec')
            except SyntaxError as ex:
                return '%s block %d: SyntaxError %s' % (eid, idx, ex)
        return None
    if mode not in ('run', 'raises'):
        return '%s block %d: unknown mode %r' % (eid, idx, mode)
    try:
        compile(src, eid, 'exec')
    except SyntaxError as ex:
        return '%s block %d: SyntaxError %s' % (eid, idx, ex)
    with tempfile.TemporaryDirectory() as d:
        f = os.path.join(d, 'example.py')
        open(f, 'w').write(src)
        r = os.path.join(d, '_runner.py')
        open(r, 'w').write(RUNNER)
        for name in ('notes.txt', 'data.txt', 'scores.csv', 'people.csv'):
            open(os.path.join(d, name), 'w').write('name,score\nAda,90\nSam,72\n' if name.endswith('csv') else 'first line\nsecond line\nthird line\n')
        from PIL import Image
        Image.new('RGB', (64, 48), (200, 80, 40)).save(os.path.join(d, 'photo.png'))
        Image.new('RGB', (64, 48), (40, 80, 200)).save(os.path.join(d, 'photo.jpg'))
        Image.new('RGB', (64, 48), (40, 200, 80)).save(os.path.join(d, 'icon.png'))
        cmd = [py, r, f]
        if 'tkinter' in src:
            cmd = ['xvfb-run', '-a'] + cmd
        try:
            p = subprocess.run(cmd, cwd=d, capture_output=True, text=True, timeout=20)
        except subprocess.TimeoutExpired:
            return '%s block %d: timed out' % (eid, idx)
        err = p.stderr.strip()
        if mode == 'raises':
            if p.returncode == 0:
                return '%s block %d: expected an error, ran fine' % (eid, idx)
            return None
        if p.returncode != 0 or err:
            return '%s block %d: exit %d\n%s' % (eid, idx, p.returncode, err[-800:])
        if expect is not None and mode == 'run':
            norm = lambda t: '\n'.join(l.rstrip() for l in t.strip('\n').split('\n'))
            if norm(p.stdout) != norm(expect):
                MISMATCH.append('%s block %d: output differs\n--- shown\n%s\n--- real\n%s' % (eid, idx, norm(expect), norm(p.stdout)[:600]))
    return None

def main():
    args = sys.argv[1:]
    py = '/home/user/pyenv/bin/python'
    if '--py' in args:
        py = args[args.index('--py') + 1]
    only = args[args.index('--only') + 1] if '--only' in args else None
    sections, entries = parse()
    ids = {e['id']: e['Q'] for e in entries}
    jobs, out = [], []
    for e in entries:
        body_html, blocks = render(e['body'], ids)
        see = [x.strip() for x in e.get('see', '').split(',') if x.strip()]
        for x in see:
            if x not in ids:
                BROKEN.add(x)
        out.append({'id': e['id'], 's': e['s'], 'q': e['Q'].replace('`', ''), 'qh': inline(e['Q'], {}), 'a': inline(e['A'], ids), 'aka': e['aka'], 'err': e['err'],
                    'h': body_html, 'see': see, 't': plain(body_html)[:1600]})
        for n, (mode, src, expect) in enumerate(blocks):
            if only and e['id'] != only and not e['id'].startswith(only):
                continue
            jobs.append((mode, src, expect, n, e['id']))
    fails = []
    if '--norun' not in args:
        with cf.ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as ex:
            for res in ex.map(lambda j: run_block(py, *j), jobs):
                if res:
                    fails.append(res)
    fails += MISMATCH
    if BROKEN:
        fails.append('broken links: ' + ', '.join(sorted(BROKEN)))
    for f in fails:
        print('FAIL', f, '\n')
    counts = {}
    for e in out:
        counts[e['s']] = counts.get(e['s'], 0) + 1
    for s in sections:
        s['n'] = counts.get(s['id'], 0)
    data = {'sections': sections, 'entries': out}
    js = 'window.PYREF=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(OUT, 'w', encoding='utf-8').write(js)
    print('%d sections, %d entries, %d code blocks checked, %d failures, %d KB' % (len(sections), len(out), len(jobs), len(fails), len(js) // 1024))
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
