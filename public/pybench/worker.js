/* Pybench worker: runs CPython (Pyodide) off the main thread.
   input() and the debugger block on shared memory; Ctrl+C goes through Pyodide's interrupt buffer. */
importScripts('vendor/pyodide/pyodide.js');

const HOME = '/home/pyodide';
const dec = new TextDecoder();
let py = null, bench = null, ctl = null, data = null, intr = null;
let outBuf = [], outStream = 'stdout', outLen = 0, lastFlush = 0;

function flush() {
  if (outBuf.length) postMessage({ t: 'out', s: outStream, v: outBuf.join('') });
  outBuf = []; outLen = 0; lastFlush = Date.now();
}
self.bench_write = (stream, s) => {
  if (stream !== outStream) { flush(); outStream = stream; }
  outBuf.push(s); outLen += s.length;
  if (outLen > 8192 || Date.now() - lastFlush > 40) flush();
};
self.bench_help = (v) => { flush(); postMessage({ t: 'help', v }); };
self.bench_errline = (file, line) => postMessage({ t: 'errline', file, line });
self.bench_turtle = (v) => { flush(); postMessage({ t: 'turtle', v }); };

/* block until the page answers through shared memory; null means cancelled */
function waitReply(kind, v) {
  flush();
  if (!ctl) { postMessage({ t: 'nosab', kind }); return null; }
  Atomics.store(ctl, 0, 0);
  postMessage({ t: kind, v });
  while (Atomics.load(ctl, 0) === 0) Atomics.wait(ctl, 0, 0, 1000);
  const st = Atomics.load(ctl, 0);
  Atomics.store(ctl, 0, 0);
  if (st === 2) return null;
  const n = Atomics.load(ctl, 1);
  const copy = new Uint8Array(n); copy.set(data.subarray(0, n));
  return dec.decode(copy);
}
self.bench_input = (prompt) => waitReply('input', prompt);
self.bench_pause = (info) => waitReply('pause', info) || '{"c":"quit"}';

function mkdirs(path) {
  const parts = path.split('/').slice(0, -1);
  let cur = '';
  for (const p of parts) { if (!p) continue; cur += '/' + p; try { py.FS.mkdir(cur); } catch (e) {} }
}
function writeFiles(files) {
  for (const [name, src] of Object.entries(files || {})) {
    const path = HOME + '/' + name;
    mkdirs(path);
    py.FS.writeFile(path, src);
  }
}
function dumpFiles() {
  const out = {};
  const walk = (dir, rel) => {
    for (const n of py.FS.readdir(dir)) {
      if (n === '.' || n === '..' || n === '__pycache__') continue;
      const p = dir + '/' + n, r = rel ? rel + '/' + n : n;
      const st = py.FS.stat(p);
      if (py.FS.isDir(st.mode)) walk(p, r);
      else if (st.size < 262144) {
        try { out[r] = dec.decode(py.FS.readFile(p)); } catch (e) {}
      }
    }
  };
  try { walk(HOME, ''); } catch (e) {}
  return out;
}

async function boot(m) {
  if (m.sab) {
    ctl = new Int32Array(m.sab, 0, 2);
    data = new Uint8Array(m.sab, 8);
    intr = new Uint8Array(m.intr);
  }
  py = await loadPyodide({ indexURL: 'vendor/pyodide/', stdout: (s) => self.bench_write('stdout', s + '\n'), stderr: (s) => self.bench_write('stderr', s + '\n') });
  if (intr) py.setInterruptBuffer(intr);
  const src = await (await fetch('bench.py')).text();
  try { py.FS.mkdirTree('/lib/pybench'); } catch (e) {}
  py.FS.writeFile('/lib/pybench/bench.py', src);
  writeFiles(m.files);
  py.runPython("import sys; sys.path.insert(0, '/lib/pybench')");
  bench = py.pyimport('bench');
  postMessage({ t: 'ready', version: py.runPython('import sys; sys.version.split()[0]'), sab: !!ctl });
}

let ready = null;
function finish(id, v) {
  if (intr) intr[0] = 0;
  try { bench.turtle_flush(); } catch (e) {}
  flush();
  postMessage({ t: 'done', id, v });
}

onmessage = async (e) => {
  const m = e.data;
  if (m.t === 'boot') { ready = boot(m).catch((err) => postMessage({ t: 'fatal', v: String(err && err.message || err) })); return; }
  await ready;
  if (!bench) return;
  try {
    switch (m.t) {
      case 'files': writeFiles(m.files); break;
      case 'rm': try { py.FS.unlink(HOME + '/' + m.name); } catch (err) {} break;
      case 'shell': writeFiles(m.files); bench.shell_run(m.src); finish(m.id, dumpFiles()); break;
      case 'run':
        writeFiles(m.files);
        bench.set_argv(JSON.stringify(m.argv || [HOME + '/' + m.name]));
        bench.run_module(m.name, m.src, !!m.debug, JSON.stringify(m.bps || []));
        finish(m.id, dumpFiles());
        break;
      case 'lesson': {
        const r = bench.lesson_check(m.code, m.check, JSON.stringify(m.stdin || []));
        finish(m.id, r);
        break;
      }
      case 'dump': postMessage({ t: 'res', id: m.id, v: dumpFiles() }); break;
      case 'call': {
        const f = bench[m.fn];
        const r = f(...(m.args || []));
        postMessage({ t: 'res', id: m.id, v: r === undefined ? null : r });
        break;
      }
    }
  } catch (err) {
    flush();
    const msg = String(err && err.message || err);
    postMessage({ t: 'out', s: 'stderr', v: msg.includes('KeyboardInterrupt') ? 'KeyboardInterrupt\n' : msg + '\n' });
    if (m.t === 'call' || m.t === 'dump') postMessage({ t: 'res', id: m.id, v: null });
    else finish(m.id);
  }
};
