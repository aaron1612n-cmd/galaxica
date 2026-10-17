-- Galaxica Online: one best row per player (or per bot) per board.
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  board TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'human',
  name TEXT NOT NULL,
  pid TEXT NOT NULL,
  bot TEXT,
  score REAL NOT NULL,
  low INTEGER NOT NULL DEFAULT 0,
  ghost TEXT,
  created INTEGER NOT NULL
);
CREATE INDEX idx_scores_board ON scores(game, board, kind, score);
CREATE INDEX idx_scores_owner ON scores(game, board, kind, pid);
CREATE TABLE hits (ip TEXT NOT NULL, t INTEGER NOT NULL);
CREATE INDEX idx_hits ON hits(ip, t);
