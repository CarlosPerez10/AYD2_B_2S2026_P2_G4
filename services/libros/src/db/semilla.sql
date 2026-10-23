-- Catálogo inicial. Solo se inserta cuando la tabla está vacía, así que es seguro
-- ejecutarlo en cada arranque. El orden importa: en una base nueva los ids quedan del
-- 1 al 30 y la semilla de Ventas usa esos ids.
INSERT INTO libro (titulo, autor, precio, existencias)
SELECT v.titulo, v.autor, v.precio, v.existencias
FROM (VALUES
  (1,  'Cien años de soledad',                              'Gabriel García Márquez',   189.50, 12),
  (2,  'El amor en los tiempos del cólera',                 'Gabriel García Márquez',   165.00,  8),
  (3,  'Crónica de una muerte anunciada',                   'Gabriel García Márquez',    95.00, 15),
  (4,  'Rayuela',                                           'Julio Cortázar',           175.00,  2),
  (5,  'Ficciones',                                         'Jorge Luis Borges',        140.00, 10),
  (6,  'El Aleph',                                          'Jorge Luis Borges',        135.00,  7),
  (7,  'Pedro Páramo',                                      'Juan Rulfo',               110.00,  9),
  (8,  'La casa de los espíritus',                          'Isabel Allende',           180.00, 11),
  (9,  'Hombres de maíz',                                   'Miguel Ángel Asturias',    150.00,  6),
  (10, 'El señor presidente',                               'Miguel Ángel Asturias',    145.00,  5),
  (11, 'La ciudad y los perros',                            'Mario Vargas Llosa',       170.00,  4),
  (12, 'Conversación en La Catedral',                       'Mario Vargas Llosa',       210.00,  3),
  (13, 'Los detectives salvajes',                           'Roberto Bolaño',           225.00,  6),
  (14, '2666',                                              'Roberto Bolaño',           295.00,  2),
  (15, 'La muerte de Artemio Cruz',                         'Carlos Fuentes',           160.00,  5),
  (16, 'El túnel',                                          'Ernesto Sabato',            98.00, 14),
  (17, 'Como agua para chocolate',                          'Laura Esquivel',           120.00, 10),
  (18, 'Veinte poemas de amor y una canción desesperada',   'Pablo Neruda',              85.00, 20),
  (19, 'El laberinto de la soledad',                        'Octavio Paz',              130.00,  7),
  (20, 'Don Quijote de la Mancha',                          'Miguel de Cervantes',      260.00,  9),
  (21, 'La sombra del viento',                              'Carlos Ruiz Zafón',        199.00, 13),
  (22, 'Niebla',                                            'Miguel de Unamuno',         90.00,  6),
  (23, '1984',                                              'George Orwell',            125.00, 18),
  (24, 'Un mundo feliz',                                    'Aldous Huxley',            118.00,  0),
  (25, 'Orgullo y prejuicio',                               'Jane Austen',              115.00,  8),
  (26, 'Crimen y castigo',                                  'Fiódor Dostoyevski',       185.00,  5),
  (27, 'El principito',                                     'Antoine de Saint-Exupéry',  75.00, 25),
  (28, 'Fahrenheit 451',                                    'Ray Bradbury',             105.00,  0),
  (29, 'El viejo y el mar',                                 'Ernest Hemingway',          88.00, 12),
  (30, 'Los de abajo',                                      'Mariano Azuela',            92.00,  4)
) AS v(orden, titulo, autor, precio, existencias)
WHERE NOT EXISTS (SELECT 1 FROM libro)
ORDER BY v.orden;
