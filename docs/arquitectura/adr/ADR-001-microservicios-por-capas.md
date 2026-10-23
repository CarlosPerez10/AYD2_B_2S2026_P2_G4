# ADR-001 · Microservicios sobre arquitectura por capas

- **Estado:** Aceptada
- **Fecha:** 2026-10-15

## Contexto

El enunciado pide separar la gestión del catálogo y el registro de ventas, favoreciendo la
disponibilidad y la escalabilidad. Las dos áreas cambian a ritmos distintos: el catálogo se
consulta mucho y se modifica poco, mientras que las ventas se escriben con frecuencia y el
ranking se recalcula sobre ellas.

## Decisión

Dividir el backend en dos microservicios, **Libros** y **Ventas**, con un contexto acotado
cada uno. Dentro de cada servicio usar capas (`routes → controllers → services →
repositories`) para que la lógica de negocio no dependa de Express ni de PostgreSQL.

## Consecuencias

- Cada servicio se despliega, escala y falla por separado: si Ventas cae, el catálogo sigue disponible.
- El equipo puede trabajar en paralelo con un responsable por servicio.
- Aparece complejidad de sistema distribuido: red entre servicios, consistencia eventual y más piezas que monitorear.
- Las capas facilitan pruebas unitarias del servicio sin levantar la base de datos.
