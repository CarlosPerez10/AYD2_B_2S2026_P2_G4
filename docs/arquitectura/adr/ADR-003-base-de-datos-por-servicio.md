# ADR-003 · Una base PostgreSQL gestionada por servicio

- **Estado:** Aceptada
- **Fecha:** 2026-10-16

## Contexto

El enunciado exige un modelo de persistencia desacoplado y escalable para cada
microservicio, aprovisionado con Terraform como base de datos gestionada. Compartir una sola
base entre servicios crearía acoplamiento por esquema.

## Decisión

Aprovisionar **dos instancias Amazon RDS PostgreSQL 16** (`libros_db` y `ventas_db`) en
subredes privadas, cada una accesible solo desde el grupo de seguridad de su servicio. Cada
servicio gestiona sus propias migraciones al arrancar.

## Consecuencias

- Un servicio puede cambiar su esquema sin coordinar con el otro.
- Las bases escalan por separado (clase de instancia, almacenamiento autoescalable).
- No hay *joins* entre catálogo y ventas: Ventas guarda una copia de título, autor y precio.
- Dos instancias RDS duplican el costo; se usa la clase `db.t3.micro`, suficiente para la práctica.
