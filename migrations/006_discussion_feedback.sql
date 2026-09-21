ALTER TABLE comments ADD COLUMN outcome text;
ALTER TABLE comments ADD COLUMN revision integer;
ALTER TABLE comments ADD CONSTRAINT comments_outcome_check CHECK (outcome IS NULL OR outcome IN ('success','partial','failed'));
