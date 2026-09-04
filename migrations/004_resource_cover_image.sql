-- Optional uploaded cover; existing resources continue to use website OG images.
ALTER TABLE resources ADD COLUMN cover_image text NOT NULL DEFAULT '';
