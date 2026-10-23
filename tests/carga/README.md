# Prueba de carga

Responsable: **Eduardo Misael López Ávila** (202100147)

Evidencia de **RNF-02**: la búsqueda de libros y el ranking deben responder rápido con
usuarios concurrentes. El script usa [k6](https://k6.io) contra la API Gateway, así que mide
el recorrido completo: gateway → microservicio → PostgreSQL.

## Escenario

| Parámetro | Valor |
|-----------|-------|
| Usuarios virtuales | 50 (subida de 10 s, 1 min sostenido, bajada de 10 s) |
| Operaciones | `GET /api/v1/libros?q=<término>` y `GET /api/v1/ventas/ranking` |
| Pausa entre iteraciones | 1 s por usuario |
| Umbrales | p95 < 500 ms por operación; errores < 1 % |

El gateway limita a 300 peticiones por minuto por IP (`RATE_LIMIT_MAX`). Con 50 usuarios
desde un solo equipo ese límite se alcanza, así que **antes de la prueba** suban el límite en
el entorno de prueba (por ejemplo `RATE_LIMIT_MAX=100000` en `.env` para Compose) y
documenten que lo hicieron.

## Ejecutar

```bash
# Local, con el sistema levantado con docker compose
k6 run tests/carga/busqueda-y-ranking.js

# En AWS
k6 run -e BASE_URL=http://<dns-del-alb> tests/carga/busqueda-y-ranking.js

# Sin instalar k6
docker run --rm -i --network host grafana/k6 run - < tests/carga/busqueda-y-ranking.js
```

## Resultados

> **Pendiente de ejecutar.** Completar con la salida real de k6 (no estimar valores).

| Fecha | Entorno | Operación | Peticiones | p95 (ms) | Errores (%) | ¿Cumple? |
|-------|---------|-----------|-----------:|---------:|------------:|----------|
| | | búsqueda | | | | |
| | | ranking | | | | |

Adjuntar el resumen de k6 en `tests/carga/resultados/` (texto o captura).
