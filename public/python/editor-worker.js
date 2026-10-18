/* Runs real CPython (Pyodide) off the main thread so a loop never freezes the page. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js');
var py, cons, ns, ids = 0, dec = new TextDecoder();
var say = function (m) { postMessage(m); };

function put(kind) { return { write: function (buf) { say({ t: 'out', k: kind, s: dec.decode(buf, { stream: true }) }); return buf.length; }, isatty: false }; }

/* input() blocks this thread on a request the page's service worker holds until the person has typed a line. */
function readLine() {
  var id = ++ids; say({ t: 'need', id: id });
  try {
    var x = new XMLHttpRequest(); x.open('GET', 'sw-stdin/' + id, false); x.send();
    if (x.status === 200) return x.responseText;
  } catch (_) {}
  return null;
}

var HELP = [
  'import sys, builtins, traceback, json',
  'def _tb(e):',
  '    t = e.__traceback__',
  '    while t and t.tb_frame.f_code.co_filename != "<editor>" and t.tb_frame.f_code.co_filename != "<console>": t = t.tb_next',
  '    return "".join(traceback.format_exception(type(e), e, t or e.__traceback__))',
  'def _run(src, g):',
  '    try:',
  '        exec(compile(src, "<editor>", "exec"), g)',
  '    except SystemExit: pass',
  '    except BaseException as e:',
  '        sys.stderr.write(_tb(e))',
  'def _peek(name):',
  '    import importlib, inspect',
  '    m = importlib.import_module(name)',
  '    doc = (inspect.getdoc(m) or "").strip().split("\\n\\n")[0]',
  '    names = sorted(n for n in dir(m) if not n.startswith("_"))[:120]',
  '    return json.dumps({"doc": doc[:600], "names": names, "file": getattr(m, "__file__", None) or "built in"})',
  'def _try(name):',
  '    import importlib',
  '    try:',
  '        importlib.import_module(name); return ""',
  '    except BaseException as e:',
  '        return type(e).__name__ + ": " + str(e)[:140]'
].join('\n');

async function boot() {
  py = await loadPyodide();
  py.setStdout(put('o')); py.setStderr(put('e')); py.setStdin({ stdin: readLine });
  py.runPython(HELP);
  var PC = py.pyimport('pyodide.console');
  ns = py.globals.get('dict')(); ns.set('__name__', '__main__');
  cons = PC.PyodideConsole(ns);
  var names = py.runPython('import sys; sorted(sys.stdlib_module_names)').toJs();
  var add = [];
  try { add = Object.keys(py._api.lockfile_packages).sort(); } catch (_) {}
  say({ t: 'ready', ver: py.runPython('import sys; sys.version.split()[0]'), mods: names, add: add });
}

function fresh() { ns.clear(); ns.set('__name__', '__main__'); ns.set('__builtins__', py.pyimport('builtins')); }

var jobs = Promise.resolve();
onmessage = function (ev) {
  var m = ev.data;
  jobs = jobs.then(async function () {
    try {
      if (m.t === 'run') {
        fresh();
        try { await py.loadPackagesFromImports(m.code); } catch (e) { say({ t: 'out', k: 'e', s: 'Could not load a package: ' + e.message + '\n' }); }
        py.globals.get('_run')(m.code, ns);
        say({ t: 'done', id: m.id });
      } else if (m.t === 'line') {
        try { await py.loadPackagesFromImports(m.line); } catch (_) {}
        var fut = cons.push(m.line), st = fut.syntax_check;
        if (st === 'incomplete') { say({ t: 'more', id: m.id }); fut.destroy(); return; }
        if (st === 'syntax-error') { say({ t: 'out', k: 'e', s: fut.formatted_error + '\n' }); fut.destroy(); say({ t: 'done', id: m.id }); return; }
        try { var v = await fut; if (v !== undefined) { say({ t: 'out', k: 'r', s: String(py.globals.get('repr')(v)) + '\n' }); if (v && v.destroy) v.destroy(); } }
        catch (e) { var fe; try { fe = fut.formatted_error; } catch (_) {} say({ t: 'out', k: 'e', s: String(fe || e.message) + '\n' }); }
        try { fut.destroy(); } catch (_) {} say({ t: 'done', id: m.id });
      } else if (m.t === 'peek') {
        try { await py.loadPackagesFromImports('import ' + m.name); } catch (_) {}
        var info;
        try { info = JSON.parse(py.globals.get('_peek')(m.name)); } catch (_) { info = { doc: '', names: [], none: 1 }; }
        say({ t: 'peek', name: m.name, info: info });
      } else if (m.t === 'probe') {
        var bad = {};
        for (var i = 0; i < m.names.length; i++) {
          var n = m.names[i];
          try { await py.loadPackagesFromImports('import ' + n); } catch (_) {}
          var e = py.globals.get('_try')(n); if (e) bad[n] = e;
          if (i % 20 === 19) say({ t: 'probing', n: i + 1 });
        }
        say({ t: 'probed', bad: bad });
      }
    } catch (e) {
      say({ t: 'out', k: 'e', s: String(e && e.message || e) + '\n' }); say({ t: 'done', id: m.id });
    }
  });
};

boot().catch(function (e) { say({ t: 'fail', s: String(e && e.message || e) }); });
