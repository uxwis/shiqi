-- Historical content columns are retained for rollback. New writes use the AI schema only.
ALTER TABLE resources ALTER COLUMN logo SET DEFAULT '';
ALTER TABLE resources ALTER COLUMN category SET DEFAULT 'AI工具';
ALTER TABLE resources ALTER COLUMN subcategory SET DEFAULT '';
ALTER TABLE resources ALTER COLUMN color SET DEFAULT '';
ALTER TABLE resources ALTER COLUMN logo_color SET DEFAULT '';
ALTER TABLE resources ALTER COLUMN short_description SET DEFAULT '';
ALTER TABLE resources ALTER COLUMN source SET DEFAULT '';
ALTER TABLE articles ALTER COLUMN category SET DEFAULT '';
ALTER TABLE articles ALTER COLUMN author_name SET DEFAULT '';
ALTER TABLE resources ADD COLUMN domain text NOT NULL DEFAULT '';
ALTER TABLE resources ADD COLUMN content_kind text NOT NULL DEFAULT 'tool';
ALTER TABLE resources ADD COLUMN ai_use text NOT NULL DEFAULT '';
ALTER TABLE resources ADD COLUMN scope text NOT NULL DEFAULT 'legacy_review' CHECK (scope IN ('ai','legacy_review','excluded'));
ALTER TABLE resources ADD COLUMN industries jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resources ADD COLUMN platforms jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE resources ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE resources ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE resources ADD COLUMN original_published_at timestamptz;
ALTER TABLE resources ADD COLUMN content_changed_at timestamptz;
ALTER TABLE resources ADD COLUMN review_days integer NOT NULL DEFAULT 14 CHECK (review_days BETWEEN 1 AND 90);
ALTER TABLE resources ADD COLUMN review_due_at timestamptz;
ALTER TABLE resources ADD COLUMN review_required boolean NOT NULL DEFAULT false;
ALTER TABLE resources ADD COLUMN verification_method text NOT NULL DEFAULT 'unverified';
ALTER TABLE resources ADD COLUMN verified_at timestamptz;
ALTER TABLE resources ADD COLUMN verified_revision integer;
ALTER TABLE resources ADD COLUMN unavailable_reason text NOT NULL DEFAULT '';
ALTER TABLE resources ADD COLUMN replacement_url text NOT NULL DEFAULT '';
ALTER TABLE resources ADD COLUMN deleted_at timestamptz;

ALTER TABLE articles ADD COLUMN domain text NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN content_kind text NOT NULL DEFAULT 'tutorial';
ALTER TABLE articles ADD COLUMN ai_use text NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN scope text NOT NULL DEFAULT 'legacy_review' CHECK (scope IN ('ai','legacy_review','excluded'));
ALTER TABLE articles ADD COLUMN industries jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN platforms jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE articles ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE articles ADD COLUMN original_published_at timestamptz;
ALTER TABLE articles ADD COLUMN content_changed_at timestamptz;
ALTER TABLE articles ADD COLUMN review_days integer NOT NULL DEFAULT 30 CHECK (review_days BETWEEN 1 AND 90);
ALTER TABLE articles ADD COLUMN review_due_at timestamptz;
ALTER TABLE articles ADD COLUMN review_required boolean NOT NULL DEFAULT false;
ALTER TABLE articles ADD COLUMN verification_method text NOT NULL DEFAULT 'unverified';
ALTER TABLE articles ADD COLUMN verified_at timestamptz;
ALTER TABLE articles ADD COLUMN verified_revision integer;
ALTER TABLE articles ADD COLUMN unavailable_reason text NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN replacement_url text NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN deleted_at timestamptz;

CREATE INDEX resources_catalog_idx ON resources(scope,status,domain,content_kind,review_due_at);
CREATE INDEX articles_catalog_idx ON articles(scope,status,domain,content_kind,review_due_at);
UPDATE resources SET featured=false;
UPDATE articles SET featured=false;

CREATE TABLE content_revisions (
 id text PRIMARY KEY, target_type text NOT NULL CHECK(target_type IN ('resource','article')),
 target_id text NOT NULL, revision integer NOT NULL, snapshot jsonb NOT NULL,
 actor_id text REFERENCES users(id) ON DELETE SET NULL, summary text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(target_type,target_id,revision)
);
CREATE TABLE verifications (
 id text PRIMARY KEY, target_type text NOT NULL CHECK(target_type IN ('resource','article')),
 target_id text NOT NULL, revision integer NOT NULL,
 method text NOT NULL CHECK(method IN ('source_checked','author_tested','editor_tested')),
 environment text NOT NULL, evidence text NOT NULL, actor_id text REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX verifications_target_idx ON verifications(target_type,target_id,created_at);
CREATE TABLE content_links (
 id text PRIMARY KEY, target_type text NOT NULL CHECK(target_type IN ('resource','article')),
 target_id text NOT NULL, kind text NOT NULL, label text NOT NULL DEFAULT '', url text NOT NULL,
 last_checked_at timestamptz, next_check_at timestamptz, check_status text NOT NULL DEFAULT 'unchecked',
 http_status integer, failure_count integer NOT NULL DEFAULT 0, check_note text NOT NULL DEFAULT '',
 UNIQUE(target_type,target_id,url)
);
CREATE TABLE article_resources (
 article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
 resource_id text NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
 position integer NOT NULL DEFAULT 0, PRIMARY KEY(article_id,resource_id)
);
CREATE TABLE topics (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, title text NOT NULL, description text NOT NULL,
 cover text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','online','offline')),
 created_by text REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE topic_items (
 topic_id text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
 target_type text NOT NULL CHECK(target_type IN ('resource','article')), target_id text NOT NULL,
 position integer NOT NULL DEFAULT 0, PRIMARY KEY(topic_id,target_type,target_id)
);
ALTER TABLE comments ALTER COLUMN resource_id DROP NOT NULL;
ALTER TABLE comments ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE comments ADD COLUMN article_id text REFERENCES articles(id) ON DELETE CASCADE;
ALTER TABLE comments ADD CONSTRAINT comments_one_target CHECK ((resource_id IS NOT NULL AND article_id IS NULL) OR (resource_id IS NULL AND article_id IS NOT NULL));
CREATE TABLE reproduction_feedback (
 id text PRIMARY KEY, target_type text NOT NULL CHECK(target_type IN ('resource','article')),
 target_id text NOT NULL, revision integer NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 outcome text NOT NULL CHECK(outcome IN ('success','partial','failed')), environment text NOT NULL,
 content text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(target_type,target_id,revision,user_id)
);
ALTER TABLE reproduction_feedback ADD COLUMN handled_at timestamptz;
ALTER TABLE reproduction_feedback ADD COLUMN handling_note text NOT NULL DEFAULT '';
CREATE TABLE link_check_history (id text PRIMARY KEY,link_id text NOT NULL REFERENCES content_links(id) ON DELETE CASCADE,checked_at timestamptz NOT NULL,result text NOT NULL,http_status integer,note text NOT NULL DEFAULT '');
CREATE INDEX content_links_due_idx ON content_links(next_check_at);
CREATE TABLE catalog_tags (
 category text NOT NULL CHECK(category IN ('industry','platform','task')), name text NOT NULL,
 PRIMARY KEY(category,name)
);
CREATE TABLE maintenance_runs (
 id text PRIMARY KEY, status text NOT NULL, checked_count integer NOT NULL DEFAULT 0,
 flagged_count integer NOT NULL DEFAULT 0, error text NOT NULL DEFAULT '',
 started_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at timestamptz
);
CREATE TABLE maintenance_locks (name text PRIMARY KEY, holder text NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE content_events_daily (
 day date NOT NULL, target_type text NOT NULL, target_id text NOT NULL, event text NOT NULL,
 count integer NOT NULL DEFAULT 0, PRIMARY KEY(day,target_type,target_id,event)
);
