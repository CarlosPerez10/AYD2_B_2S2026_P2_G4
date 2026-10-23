-- unaccent() no es IMMUTABLE (depende del diccionario configurado), así que no se puede
-- indexar directamente. Este envoltorio fija el diccionario y sí se puede declarar IMMUTABLE.
CREATE OR REPLACE FUNCTION f_unaccent(texto text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, texto) $$;

CREATE INDEX IF NOT EXISTS idx_libro_titulo_trgm
  ON libro USING gin (f_unaccent(lower(titulo)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_libro_autor_trgm
  ON libro USING gin (f_unaccent(lower(autor)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_libro_precio ON libro (precio);
