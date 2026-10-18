/* Holds a worker's input() request open until the page sends the typed line. */
var wait = {}, got = {};
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.stdin === undefined) return;
  if (wait[d.id]) { wait[d.id](new Response(d.line == null ? '' : d.line, { status: d.line == null ? 204 : 200 })); delete wait[d.id]; }
  else got[d.id] = d.line;
});
self.addEventListener('fetch', function (e) {
  var m = new URL(e.request.url).pathname.match(/sw-stdin\/(\d+)$/);
  if (!m) return;
  var id = m[1];
  e.respondWith(new Promise(function (ok) {
    if (id in got) { var l = got[id]; delete got[id]; ok(new Response(l == null ? '' : l, { status: l == null ? 204 : 200 })); }
    else wait[id] = ok;
  }));
});
