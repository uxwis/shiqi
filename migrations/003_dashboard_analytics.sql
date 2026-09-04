-- Preserve legacy seed/lifetime counters; new analytics use recorded events only.
ALTER TABLE articles ADD COLUMN actual_views_count integer NOT NULL DEFAULT 0;

CREATE TABLE analytics_tracking (
  name text PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO analytics_tracking (name) VALUES ('content_views');

CREATE TABLE content_view_daily (
  day date PRIMARY KEY,
  resource_views bigint NOT NULL DEFAULT 0 CHECK (resource_views >= 0),
  article_views bigint NOT NULL DEFAULT 0 CHECK (article_views >= 0)
);
