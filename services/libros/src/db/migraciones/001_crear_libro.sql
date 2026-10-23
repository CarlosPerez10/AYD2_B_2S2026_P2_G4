CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS libro (
  id             SERIAL PRIMARY KEY,
  isbn           VARCHAR(13) UNIQUE,
  titulo         VARCHAR(200) NOT NULL,
  autor          VARCHAR(150) NOT NULL,
  precio         NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  existencias    INTEGER NOT NULL CHECK (existencias >= 0),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
