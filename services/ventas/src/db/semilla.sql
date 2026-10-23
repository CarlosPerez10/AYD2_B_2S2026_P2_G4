-- Ventas de ejemplo para que el ranking tenga datos desde el primer arranque.
-- Los libro_id, títulos, autores y precios coinciden con services/libros/src/db/semilla.sql
-- (ids 1 a 30 en una base nueva). Son datos históricos: no descuentan existencias en Libros.
-- Solo se inserta cuando la tabla está vacía.
INSERT INTO venta (libro_id, titulo, autor, cantidad, precio_unitario, total, fecha)
SELECT v.libro_id, v.titulo, v.autor, v.cantidad, v.precio, v.precio * v.cantidad,
       now() - make_interval(days => v.hace_dias)
FROM (VALUES
  (1,  'Cien años de soledad',            'Gabriel García Márquez',   189.50, 3, 2),
  (1,  'Cien años de soledad',            'Gabriel García Márquez',   189.50, 2, 9),
  (1,  'Cien años de soledad',            'Gabriel García Márquez',   189.50, 1, 20),
  (4,  'Rayuela',                         'Julio Cortázar',           175.00, 2, 3),
  (4,  'Rayuela',                         'Julio Cortázar',           175.00, 2, 15),
  (7,  'Pedro Páramo',                    'Juan Rulfo',               110.00, 4, 5),
  (9,  'Hombres de maíz',                 'Miguel Ángel Asturias',    150.00, 1, 1),
  (9,  'Hombres de maíz',                 'Miguel Ángel Asturias',    150.00, 2, 12),
  (10, 'El señor presidente',             'Miguel Ángel Asturias',    145.00, 3, 6),
  (13, 'Los detectives salvajes',         'Roberto Bolaño',           225.00, 1, 4),
  (16, 'El túnel',                        'Ernesto Sabato',            98.00, 3, 8),
  (21, 'La sombra del viento',            'Carlos Ruiz Zafón',        199.00, 2, 2),
  (21, 'La sombra del viento',            'Carlos Ruiz Zafón',        199.00, 1, 25),
  (23, '1984',                            'George Orwell',            125.00, 4, 10),
  (27, 'El principito',                   'Antoine de Saint-Exupéry',  75.00, 5, 7),
  (27, 'El principito',                   'Antoine de Saint-Exupéry',  75.00, 2, 30)
) AS v(libro_id, titulo, autor, precio, cantidad, hace_dias)
WHERE NOT EXISTS (SELECT 1 FROM venta);
