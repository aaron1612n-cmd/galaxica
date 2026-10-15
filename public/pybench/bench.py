"""Pybench runtime: the Python half of the IDLE-style workbench (runs inside a Web Worker on Pyodide)."""
import sys, builtins, codeop, traceback, ast, inspect, rlcompleter, keyword, difflib, json, types, io, linecache, re, bdb, reprlib, os, importlib

import js  # functions the worker exposes: bench_write, bench_help, bench_input, bench_pause, bench_turtle

# ---------------------------------------------------------------- output
class _Stream(io.TextIOBase):
    def __init__(self, name):
        self.name = name
    def writable(self):
        return True
    def write(self, s):
        if s:
            js.bench_write(self.name, s)
        return len(s)
    def flush(self):
        pass

sys.stdout = _Stream('stdout')
sys.stderr = _Stream('stderr')

def _input(prompt=''):
    s = js.bench_input(str(prompt))
    if s is None:
        raise KeyboardInterrupt
    return str(s)
builtins.input = _input

_rep = reprlib.Repr()
_rep.maxstring = 80
_rep.maxother = 80
_rep.maxlist = 12
_rep.maxdict = 10

HOME = '/home/pyodide'
os.chdir(HOME)
if HOME not in sys.path:
    sys.path.insert(0, HOME)

MAIN = {}
def _fresh_main(fname=None):
    global MAIN
    m = types.ModuleType('__main__')
    sys.modules['__main__'] = m
    MAIN = m.__dict__
    MAIN['__builtins__'] = builtins
    if fname:
        MAIN['__file__'] = fname
    return MAIN
_fresh_main()

_count = [0]
LAST = {'tb': None}

def _cache(fname, src):
    linecache.cache[fname] = (len(src), None, src.splitlines(True), fname)

# ---------------------------------------------------------------- friendly explanations
def _names():
    return list(MAIN.keys()) + dir(builtins)

def explain(e):
    t = type(e).__name__
    msg = str(e)
    out = []
    if isinstance(e, (IndentationError, TabError)):
        if 'expected an indented block' in msg:
            out.append("Python expected the next line to be indented. After a line ending in a colon (if, for, while, def, class, else, try...), the lines that belong to it must be pushed in by 4 spaces.")
        elif 'unexpected indent' in msg:
            out.append("This line is pushed in further than Python expected. Lines in the same block must start at exactly the same column.")
        elif 'unindent does not match' in msg:
            out.append("This line's indentation doesn't line up with any earlier block. Make it match the indentation of the block it belongs to.")
        elif isinstance(e, TabError):
            out.append("Tabs and spaces are mixed in the indentation. Use Format > Untabify region to turn tabs into spaces.")
        else:
            out.append("Something is wrong with the indentation (the spaces at the start of the line).")
    elif isinstance(e, SyntaxError):
        if "expected ':'" in msg:
            out.append("A line that starts a block (if, elif, else, for, while, def, class, try, except, with) must end with a colon  :")
        elif 'unterminated string' in msg or 'EOL while scanning' in msg:
            out.append("A string was opened with a quote but never closed. Strings need a matching quote at both ends: 'like this' or \"like this\".")
        elif 'unterminated triple-quoted' in msg:
            out.append("A triple-quoted string (''' or \"\"\") was never closed.")
        elif 'was never closed' in msg:
            out.append("A bracket was opened but never closed. Every ( [ { needs a matching ) ] }.")
        elif 'unmatched' in msg or 'does not match opening' in msg:
            out.append("There is a closing bracket without a matching opening one, or the brackets are crossed.")
        elif 'Missing parentheses in call to' in msg:
            out.append("In Python 3, print is a function, so it needs brackets: print(\"hello\").")
        elif 'forgot a comma' in msg:
            out.append("Two values are next to each other with nothing between them. A comma is probably missing.")
        elif 'cannot assign to' in msg:
            out.append("The left side of = must be a name (or an item like x[0]). Did you mean == to compare?")
        elif "'return' outside function" in msg:
            out.append("return can only be used inside a def function.")
        elif 'invalid character' in msg:
            out.append("There is a character Python doesn't understand, often a curly quote (‘ ’ “ ”) pasted from a document. Retype the quotes.")
        elif 'leading zeros' in msg:
            out.append("Whole numbers can't start with 0 (like 07). Write 7.")
        else:
            out.append("Python couldn't understand this line. Check for a missing bracket, quote, colon or comma near the arrow.")
    elif isinstance(e, UnboundLocalError):
        out.append("This function assigns to that name somewhere, so Python treats it as a local variable for the whole function, but it was used before being given a value. Pass it in as a parameter, or declare it with  global  if you really mean the outer variable.")
    elif isinstance(e, NameError):
        name = getattr(e, 'name', None) or (re.findall(r"'(.+?)'", msg) or [''])[0]
        out.append(f"Python doesn't know the name '{name}'. Either it has a typo, it is used before it is created, or it was meant to be a string and needs quotes around it.")
        if name in ('true', 'false', 'none', 'null'):
            out.append("Python spells these True, False and None (capital first letter).")
    elif isinstance(e, ModuleNotFoundError):
        out.append("That module isn't available here. Pybench runs the Python standard library (math, random, datetime, json, turtle...) in your browser; packages from pip aren't installed. If it's your own file, check the file name in the Files panel.")
    elif isinstance(e, ImportError):
        out.append("The module was found, but the name you tried to import from it doesn't exist. Check the spelling.")
    elif isinstance(e, TypeError):
        if 'can only concatenate str' in msg or ('unsupported operand' in msg and 'str' in msg):
            out.append("You're joining text and a number. Turn the number into text with str(n), or use an f-string: f\"score: {n}\".")
        elif 'not callable' in msg:
            out.append("You put () after something that isn't a function. Maybe a variable has the same name as a function, or a * (multiply) is missing, like 2(3) instead of 2*(3).")
        elif 'required positional argument' in msg:
            out.append("The function was called with fewer values than it needs. Look at its def line to see how many it takes.")
        elif 'positional argument' in msg and 'were given' in msg:
            out.append("The function was called with more values than it accepts. If it's a method in a class, remember the first parameter must be self.")
        elif 'not subscriptable' in msg:
            out.append("You used [ ] on something that isn't a list, string or dict. Check what type the value really is with type(x).")
        elif 'not iterable' in msg:
            out.append("A for loop (or list(), sum()...) needs a sequence like a list, string or range(n). To loop a number of times, use range(n).")
        elif 'not supported between' in msg:
            out.append("These two values can't be compared, often a number and a string. input() always gives a string: convert with int() or float().")
        elif 'unsupported operand' in msg:
            out.append("That operator doesn't work with these types of values. Check the types with type(x).")
        else:
            out.append("A value of the wrong type was used here.")
    elif isinstance(e, ValueError):
        if 'invalid literal for int()' in msg:
            out.append("int() was given text that isn't a whole number. input() returns text: make sure the user typed digits only, or use float() for decimals.")
        elif 'could not convert string to float' in msg:
            out.append("float() was given text that isn't a number.")
        elif 'too many values to unpack' in msg or 'not enough values to unpack' in msg:
            out.append("The number of names on the left of = doesn't match the number of values on the right.")
        elif 'math domain error' in msg:
            out.append("That maths function can't take this value (for example the square root of a negative number).")
        else:
            out.append("The type is right but the value isn't allowed here.")
    elif isinstance(e, IndexError):
        out.append("You asked for a position that doesn't exist. Positions start at 0, so the last item of a list is at len(x) - 1.")
    elif isinstance(e, KeyError):
        out.append(f"The dictionary doesn't have the key {msg}. Use  key in d  to check first, or d.get(key) which gives None instead of an error.")
    elif isinstance(e, AttributeError):
        out.append("That object doesn't have this attribute or method. Check the spelling, and check the object's type with type(x) and what it offers with dir(x).")
    elif isinstance(e, ZeroDivisionError):
        out.append("You divided by zero, which has no answer. Check the value before dividing: if b != 0: ...")
    elif isinstance(e, RecursionError):
        out.append("A function kept calling itself and never stopped. Recursive functions need a base case: a condition where they return without calling themselves.")
    elif isinstance(e, FileNotFoundError):
        out.append("There's no file with that name. Files you save in Pybench live in the Files panel; open them by their name, like open('notes.txt').")
    elif isinstance(e, AssertionError):
        out.append("An assert statement found that its condition was False.")
    elif isinstance(e, OverflowError):
        out.append("The number got too big to handle.")
    elif isinstance(e, StopIteration):
        out.append("next() was called on an iterator that has no more items.")
    elif isinstance(e, MemoryError):
        out.append("The program tried to use more memory than the browser allows.")
    return '\n'.join(out)

def _user_frames(tb):
    out = []
    while tb is not None:
        f = tb.tb_frame
        fn = f.f_code.co_filename
        if not fn.startswith('/lib/pybench') and not fn.startswith('/lib/python') and '<frozen' not in fn and '_pyodide' not in fn:
            out.append(tb)
        tb = tb.tb_next
    return out

def show_exception(e, tb):
    LAST['tb'] = tb
    LAST['exc'] = e
    # trim our own frames from the front of the traceback
    frames = _user_frames(tb)
    if frames:
        tb2 = frames[0]
    else:
        tb2 = None
    text = ''.join(traceback.format_exception(type(e), e, tb2))
    sys.stderr.write(text)
    hint = explain(e)
    if hint:
        js.bench_help(hint)
    line = None
    if isinstance(e, SyntaxError) and e.filename and not e.filename.startswith('<pyshell'):
        line = (e.filename, e.lineno or 1)
    elif frames:
        last = frames[-1]
        line = (last.tb_frame.f_code.co_filename, last.tb_lineno)
    if line:
        js.bench_errline(line[0], line[1])

# ---------------------------------------------------------------- shell
def shell_run(src):
    """Run what was typed at the >>> prompt. Several statements are fine; bare expressions echo like the REPL."""
    if not src.strip():
        return
    fname = f'<pyshell#{_count[0]}>'
    _count[0] += 1
    _cache(fname, src + '\n')
    try:
        tree = ast.parse(src + '\n', fname, 'exec')
        code = compile(ast.Interactive(body=tree.body), fname, 'single')
    except (SyntaxError, ValueError, OverflowError) as e:
        show_exception(e, e.__traceback__)
        return
    run_code(code)

def run_code(code):
    try:
        exec(code, MAIN)
    except SystemExit:
        pass
    except BaseException as e:
        show_exception(e, e.__traceback__)

# ---------------------------------------------------------------- run module / check module
USERFILES = set()

def _forget_user_modules():
    for name in list(sys.modules):
        m = sys.modules.get(name)
        f = getattr(m, '__file__', None) or ''
        if f.startswith(HOME):
            del sys.modules[name]
    importlib.invalidate_caches()

def run_module(fname, source, debug=False, bps_json='[]'):
    _fresh_main(os.path.join(HOME, fname))
    _forget_user_modules()
    path = os.path.join(HOME, fname)
    _cache(path, source)
    try:
        code = compile(source, path, 'exec')
    except (SyntaxError, ValueError) as e:
        show_exception(e, e.__traceback__)
        return
    if debug:
        Debugger(json.loads(bps_json)).go(code)
    else:
        run_code(code)

def check_module(source, fname='file.py'):
    try:
        compile(source, fname, 'exec')
        return None
    except (SyntaxError, ValueError) as e:
        return json.dumps({'line': getattr(e, 'lineno', 1) or 1, 'col': getattr(e, 'offset', 1) or 1, 'msg': getattr(e, 'msg', str(e)), 'hint': explain(e)})

# ---------------------------------------------------------------- completions & call tips
def complete(text):
    res = set()
    if '.' not in text:
        for k in keyword.kwlist:
            if k.startswith(text):
                res.add(k)
    comp = rlcompleter.Completer(MAIN)
    i = 0
    while i < 300:
        try:
            r = comp.complete(text, i)
        except Exception:
            r = None
        if r is None:
            break
        res.add(r.rstrip('('))
        i += 1
    tail = text.rsplit('.', 1)[-1]
    out = sorted(res, key=lambda s: (s.rsplit('.', 1)[-1].startswith('_'), s.lower()))
    if not tail.startswith('_'):
        out = [s for s in out if not s.rsplit('.', 1)[-1].startswith('_')]
    return json.dumps(out[:80])

def calltip(expr):
    try:
        obj = eval(expr, MAIN)
    except Exception:
        return None
    name = getattr(obj, '__name__', expr)
    try:
        sig = str(inspect.signature(obj))
    except (TypeError, ValueError):
        sig = '(...)'
    doc = inspect.getdoc(obj) or ''
    first = doc.strip().split('\n\n')[0].replace('\n', ' ')[:200] if doc else ''
    return json.dumps({'sig': f'{name}{sig}', 'doc': first})

# ---------------------------------------------------------------- variables, stack viewer, outline
def _desc(v):
    try:
        return _rep.repr(v)
    except Exception:
        return '<unprintable>'

def variables():
    out = []
    for k, v in MAIN.items():
        if k.startswith('__') or isinstance(v, types.ModuleType):
            continue
        out.append([k, type(v).__name__, _desc(v)])
    return json.dumps(out)

def stack_info():
    tb = LAST.get('tb')
    frames = []
    for t in _user_frames(tb):
        f = t.tb_frame
        loc = [[k, type(v).__name__, _desc(v)] for k, v in f.f_locals.items() if not k.startswith('__') and not isinstance(v, types.ModuleType)]
        frames.append({'file': f.f_code.co_filename, 'line': t.tb_lineno, 'func': f.f_code.co_name, 'src': (linecache.getline(f.f_code.co_filename, t.tb_lineno) or '').strip(), 'locals': loc[:60]})
    e = LAST.get('exc')
    return json.dumps({'exc': f'{type(e).__name__}: {e}' if e else '', 'frames': frames})

def outline(source):
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return '[]'
    out = []
    def walk(node, depth):
        for n in ast.iter_child_nodes(node):
            if isinstance(n, ast.ClassDef):
                out.append(['class', n.name, n.lineno, depth])
                walk(n, depth + 1)
            elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                args = ', '.join(a.arg for a in n.args.args)
                out.append(['def', f'{n.name}({args})', n.lineno, depth])
                walk(n, depth + 1)
    walk(tree, 0)
    return json.dumps(out)

def inspect_name(expr):
    try:
        obj = eval(expr, MAIN)
    except Exception as e:
        return json.dumps({'err': f'{type(e).__name__}: {e}'})
    doc = inspect.getdoc(obj) or ''
    try:
        sig = str(inspect.signature(obj))
    except (TypeError, ValueError):
        sig = ''
    attrs = [a for a in dir(obj) if not a.startswith('_')][:120]
    return json.dumps({'type': type(obj).__name__, 'repr': _desc(obj), 'sig': sig, 'doc': doc[:4000], 'attrs': attrs})

def syspath():
    files = []
    for root, dirs, fs in os.walk(HOME):
        for f in fs:
            p = os.path.join(root, f)
            files.append([os.path.relpath(p, HOME), os.path.getsize(p)])
    return json.dumps({'path': sys.path, 'files': sorted(files), 'version': sys.version})

# ---------------------------------------------------------------- debugger (stdlib bdb, paused through shared memory)
class Debugger(bdb.Bdb):
    def __init__(self, bps):
        super().__init__()
        self._bps = bps
    def _is_user(self, frame):
        fn = frame.f_code.co_filename
        return fn.startswith(HOME)
    def go(self, code):
        for b in self._bps:
            self.set_break(os.path.join(HOME, b[0]), b[1])
        try:
            self.run(code, MAIN, MAIN)
        except bdb.BdbQuit:
            sys.stderr.write('Debugging stopped.\n')
        except SystemExit:
            pass
        except BaseException as e:
            show_exception(e, e.__traceback__)
    def user_line(self, frame):
        if not self._is_user(frame):
            return
        self._interact(frame, 'line')
    def dispatch_call(self, frame, arg):
        # never trace inside the standard library; calls back into user code still get traced
        if self.botframe is not None and not self._is_user(frame):
            return None
        return super().dispatch_call(frame, arg)
    def _interact(self, frame, why, exc=None):
        stack = []
        f = frame
        while f is not None:
            if self._is_user(f):
                stack.append({'file': os.path.relpath(f.f_code.co_filename, HOME), 'line': f.f_lineno, 'func': f.f_code.co_name})
            f = f.f_back
        loc = [[k, type(v).__name__, _desc(v)] for k, v in frame.f_locals.items() if not k.startswith('__') and not isinstance(v, types.ModuleType)]
        glo = [[k, type(v).__name__, _desc(v)] for k, v in frame.f_globals.items() if not k.startswith('__') and not isinstance(v, (types.ModuleType, types.FunctionType, type))] if frame.f_globals is not frame.f_locals else []
        info = {'file': os.path.relpath(frame.f_code.co_filename, HOME), 'line': frame.f_lineno, 'func': frame.f_code.co_name, 'why': why,
                'exc': f'{exc[0].__name__}: {exc[1]}' if exc else '', 'locals': loc[:80], 'globals': glo[:80], 'stack': stack}
        reply = js.bench_pause(json.dumps(info))
        cmd = json.loads(str(reply))
        if 'bps' in cmd:
            self.clear_all_breaks()
            for b in cmd['bps']:
                self.set_break(os.path.join(HOME, b[0]), b[1])
        c = cmd.get('c')
        if c == 'step':
            self.set_step()
        elif c == 'over':
            self.set_next(frame)
        elif c == 'out':
            self.set_return(frame)
        elif c == 'go':
            self.set_continue()
        else:
            self.set_quit()

# ---------------------------------------------------------------- lessons: run a learner's code against checks
def lesson_check(code, check, stdin_lines_json='[]'):
    feed = list(json.loads(stdin_lines_json))
    out = io.StringIO()
    ns = {'__name__': '__main__', '__builtins__': builtins}
    old_out, old_in = sys.stdout, builtins.input
    def fake_input(prompt=''):
        out.write(str(prompt))
        if not feed:
            raise EOFError('the checker ran out of test input')
        v = feed.pop(0)
        out.write(v + '\n')
        return v
    try:
        sys.stdout = out
        builtins.input = fake_input
        exec(compile(code, '<lesson>', 'exec'), ns)
    except BaseException as e:
        sys.stdout, builtins.input = old_out, old_in
        return json.dumps({'ok': False, 'msg': f'Your code raised {type(e).__name__}: {e}', 'hint': explain(e)})
    finally:
        sys.stdout, builtins.input = old_out, old_in
    ns['OUTPUT'] = out.getvalue()
    ns['SOURCE'] = code
    try:
        exec(check, ns)
    except AssertionError as e:
        return json.dumps({'ok': False, 'msg': str(e) or 'Not quite yet.'})
    except NameError as e:
        return json.dumps({'ok': False, 'msg': f"Your program needs something called '{getattr(e, 'name', '') or e}'. Check the task and the spelling."})
    except BaseException as e:
        return json.dumps({'ok': False, 'msg': f'{type(e).__name__}: {e}'})
    return json.dumps({'ok': True, 'msg': ''})

# ---------------------------------------------------------------- turtle graphics (drawn on a canvas in the page)
_turtle_src = r'''
"""Turtle graphics for Pybench: the classic turtle API, drawn on the Turtle panel."""
import math as _m, json as _j, js as _js
_COLORMODE = [1.0]
_ids = [0]
_screen = [None]
_buf = []
def _send(*cmd):
    _buf.append(list(cmd))
    if len(_buf) >= 200:
        _flush()
def _flush():
    if _buf:
        _js.bench_turtle(_j.dumps(_buf))
        _buf.clear()
def _col(args):
    if len(args) == 1:
        c = args[0]
    elif len(args) == 3:
        c = tuple(args)
    else:
        return None
    if isinstance(c, (tuple, list)):
        r, g, b = c
        if _COLORMODE[0] == 1.0:
            r, g, b = int(r * 255), int(g * 255), int(b * 255)
        return '#%02x%02x%02x' % (int(r), int(g), int(b))
    return str(c)

class Turtle:
    def __init__(self, shape='classic', visible=True):
        _ids[0] += 1
        self._id = _ids[0]
        self._x = 0.0; self._y = 0.0; self._h = 0.0
        self._down = True; self._pc = 'black'; self._fc = 'black'; self._w = 1
        self._vis = visible; self._shape = shape; self._speed = 3
        self._fill = None
        Screen()
        _send('new', self._id, shape, visible)
    # --- movement
    def _moveto(self, x, y):
        if self._down:
            _send('line', self._id, self._x, self._y, x, y, self._pc, self._w)
        else:
            _send('move', self._id, x, y)
        if self._fill is not None:
            self._fill.append((x, y))
        self._x, self._y = x, y
    def forward(self, d):
        a = _m.radians(self._h)
        self._moveto(self._x + d * _m.cos(a), self._y + d * _m.sin(a))
    fd = forward
    def backward(self, d):
        self.forward(-d)
    bk = back = backward
    def left(self, a):
        self._h = (self._h + a) % 360
        _send('turn', self._id, self._h)
    lt = left
    def right(self, a):
        self.left(-a)
    rt = right
    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._moveto(float(x), float(y))
    setpos = setposition = goto
    def setx(self, x):
        self.goto(x, self._y)
    def sety(self, y):
        self.goto(self._x, y)
    def setheading(self, a):
        self._h = a % 360
        _send('turn', self._id, self._h)
    seth = setheading
    def home(self):
        self.goto(0, 0)
        self.setheading(0)
    def circle(self, radius, extent=None, steps=None):
        extent = 360 if extent is None else extent
        steps = steps or max(8, int(abs(extent) / 6))
        step = extent / steps
        length = 2 * radius * _m.sin(_m.radians(step) / 2)
        self.left(step / 2)
        for _ in range(steps):
            self.forward(length)
            self.left(step)
        self.left(-step / 2)
    def dot(self, size=None, *color):
        c = _col(color) if color else self._pc
        _send('dot', self._id, self._x, self._y, size or max(self._w + 4, self._w * 2), c)
    def stamp(self):
        _send('stamp', self._id, self._x, self._y, self._h, self._fc, self._pc, self._shape)
        return 0
    def write(self, arg, move=False, align='left', font=('Arial', 8, 'normal')):
        _send('write', self._id, self._x, self._y, str(arg), self._pc, align, list(font))
    # --- pen
    def penup(self):
        self._down = False
    pu = up = penup
    def pendown(self):
        self._down = True
    pd = down = pendown
    def isdown(self):
        return self._down
    def pensize(self, w=None):
        if w is None:
            return self._w
        self._w = w
    width = pensize
    def pencolor(self, *a):
        if not a:
            return self._pc
        self._pc = _col(a)
        _send('color', self._id, self._pc, self._fc)
    def fillcolor(self, *a):
        if not a:
            return self._fc
        self._fc = _col(a)
        _send('color', self._id, self._pc, self._fc)
    def color(self, *a):
        if not a:
            return (self._pc, self._fc)
        if len(a) == 2:
            self._pc, self._fc = _col([a[0]]), _col([a[1]])
        else:
            self._pc = self._fc = _col(a)
        _send('color', self._id, self._pc, self._fc)
    def begin_fill(self):
        self._fill = [(self._x, self._y)]
        _send('bfill', self._id)
    def end_fill(self):
        if self._fill and len(self._fill) > 2:
            _send('fill', self._id, self._fill, self._fc)
        self._fill = None
    def filling(self):
        return self._fill is not None
    # --- state
    def hideturtle(self):
        self._vis = False
        _send('vis', self._id, False)
    ht = hideturtle
    def showturtle(self):
        self._vis = True
        _send('vis', self._id, True)
    st = showturtle
    def isvisible(self):
        return self._vis
    def speed(self, s=None):
        if s is None:
            return self._speed
        names = {'fastest': 0, 'fast': 10, 'normal': 6, 'slow': 3, 'slowest': 1}
        self._speed = names.get(s, s)
        _send('speed', self._id, self._speed)
    def shape(self, name=None):
        if name is None:
            return self._shape
        self._shape = name
        _send('shape', self._id, name)
    def shapesize(self, *a, **k):
        pass
    turtlesize = shapesize
    def position(self):
        return (round(self._x, 6), round(self._y, 6))
    pos = position
    def xcor(self):
        return self._x
    def ycor(self):
        return self._y
    def heading(self):
        return self._h
    def towards(self, x, y=None):
        if y is None:
            x, y = x
        return _m.degrees(_m.atan2(y - self._y, x - self._x)) % 360
    def distance(self, x, y=None):
        if y is None:
            x, y = x
        return _m.hypot(x - self._x, y - self._y)
    def clear(self):
        _send('clear', self._id)
    def reset(self):
        self._x = self._y = self._h = 0.0
        self._down = True; self._pc = self._fc = 'black'; self._w = 1
        _send('reset', self._id)
    def getscreen(self):
        return Screen()
    def onclick(self, *a, **k):
        pass
    def ondrag(self, *a, **k):
        pass

Pen = RawTurtle = Turtle

class _Screen:
    def __init__(self):
        _send('screen')
    def bgcolor(self, *a):
        if a:
            _send('bg', _col(a))
    def title(self, *a):
        pass
    def setup(self, width=None, height=None, *a):
        pass
    def screensize(self, *a, **k):
        return (400, 300)
    def tracer(self, n=None, delay=None):
        if n is not None:
            _send('tracer', n)
    def update(self):
        _flush()
    def colormode(self, m=None):
        if m is None:
            return _COLORMODE[0]
        _COLORMODE[0] = 255 if m == 255 else 1.0
    def window_width(self):
        return 640
    def window_height(self):
        return 480
    def mainloop(self):
        _flush()
    done = exitonclick = mainloop
    def bye(self):
        _flush()
    def listen(self, *a):
        pass
    def onkey(self, *a, **k):
        pass
    onkeypress = onkeyrelease = onclick = onscreenclick = ontimer = onkey
    def clear(self):
        _send('clearall')
    clearscreen = clear
    def reset(self):
        _send('clearall')
    resetscreen = reset
    def turtles(self):
        return []
    def delay(self, *a):
        pass

def Screen():
    if _screen[0] is None:
        _screen[0] = _Screen()
    return _screen[0]

_default = [None]
def _t():
    if _default[0] is None:
        _default[0] = Turtle()
    return _default[0]

def done():
    _flush()
mainloop = exitonclick = bye = done

for _name in ['forward','fd','backward','bk','back','left','lt','right','rt','goto','setpos','setposition','setx','sety','setheading','seth','home','circle','dot','stamp','write',
              'penup','pu','up','pendown','pd','down','isdown','pensize','width','pencolor','fillcolor','color','begin_fill','end_fill','filling','hideturtle','ht','showturtle','st',
              'isvisible','speed','shape','shapesize','turtlesize','position','pos','xcor','ycor','heading','towards','distance','clear','reset','onclick','ondrag']:
    globals()[_name] = (lambda n: (lambda *a, **k: getattr(_t(), n)(*a, **k)))(_name)
for _name in ['bgcolor','title','setup','screensize','tracer','update','colormode','window_width','window_height','listen','onkey','onkeypress','onkeyrelease','onscreenclick','ontimer','clearscreen','resetscreen','delay']:
    globals()[_name] = (lambda n: (lambda *a, **k: getattr(Screen(), n)(*a, **k)))(_name)
'''
_tm = types.ModuleType('turtle')
_tm.__file__ = '<pybench turtle>'
exec(compile(_turtle_src, '<pybench turtle>', 'exec'), _tm.__dict__)
sys.modules['turtle'] = _tm

def turtle_flush():
    try:
        sys.modules['turtle']._flush()
    except Exception:
        pass

def module_source(name):
    """Source of a standard-library module, for File > Open Module."""
    try:
        m = importlib.import_module(name)
        f = getattr(m, '__file__', None) or name
        f = re.sub(r'^.*?python3\d*(\.zip)?/', '', f)
        return json.dumps({'file': f, 'src': inspect.getsource(m)})
    except Exception as e:
        return json.dumps({'err': f'{type(e).__name__}: {e}'})

def set_argv(args_json):
    sys.argv = json.loads(args_json)
