-- Keep historical/demo counts intact; count real detail-page visits separately.
ALTER TABLE resources ADD COLUMN actual_views_count integer NOT NULL DEFAULT 0;
