-- Optional: the Worker also creates these tables automatically on the first request.
CREATE TABLE IF NOT EXISTS students (
  student_id   TEXT PRIMARY KEY,
  nickname     TEXT NOT NULL,
  pin_hash     TEXT NOT NULL,
  salt         TEXT NOT NULL,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Optional allow-list. If this table has any rows, only these Student IDs can sign up.
CREATE TABLE IF NOT EXISTS roster (student_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ip_attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ip ON ip_attempts (ip, ts);
