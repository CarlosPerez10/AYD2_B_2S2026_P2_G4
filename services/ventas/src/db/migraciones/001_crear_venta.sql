-- Sin llave foránea: libro_id es una referencia lógica a otra base de datos (ADR-003).
CREATE TABLE IF NOT EXISTS venta (
  id              SERIAL PRIMARY KEY,
  libro_id        INTEGER NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  autor           VARCHAR(150) NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  total           NUMERIC(12,2) NOT NULL,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venta_libro_id ON venta (libro_id);
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta (fecha);
