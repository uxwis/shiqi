CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nickname text NOT NULL,
  bio text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  gender text NOT NULL DEFAULT '不公开',
  birthday date,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS verification_codes (
  id text PRIMARY KEY,
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('register', 'reset')),
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS verification_codes_lookup_idx
  ON verification_codes(lower(email), purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS resources (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo text NOT NULL,
  icon_url text,
  category text NOT NULL CHECK (category IN ('AI工具', '软件工具')),
  subcategory text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL,
  logo_color text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tutorial jsonb NOT NULL DEFAULT '[]'::jsonb,
  scenarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric(2,1) NOT NULL DEFAULT 4.0,
  ratings_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  favorites_count integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  source text NOT NULL,
  website text NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS resources_public_idx ON resources(status, category, updated_at DESC);
CREATE INDEX IF NOT EXISTS resources_owner_idx ON resources(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL,
  category text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  author_name text NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  read_time integer NOT NULL DEFAULT 3,
  views_count integer NOT NULL DEFAULT 0,
  favorites_count integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  cover text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS articles_public_idx ON articles(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS articles_owner_idx ON articles(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id text PRIMARY KEY,
  resource_id text NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS comments_resource_idx ON comments(resource_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_owner_idx ON comments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id text NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('resource', 'article')),
  target_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS favorites_target_idx ON favorites(target_type, target_id);

CREATE TABLE IF NOT EXISTS submissions (
  id text PRIMARY KEY,
  target_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('tool', 'article')),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  category text,
  summary text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS submissions_owner_idx ON submissions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  target_id text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('resource', 'article')),
  report_type text NOT NULL,
  detail text NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  handled_by text REFERENCES users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
