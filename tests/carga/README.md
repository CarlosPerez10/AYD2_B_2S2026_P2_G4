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

| Fecha | Entorno | Operación | Peticiones | p95 (ms) | Errores (%) | ¿Cumple? |
|-------|---------|-----------|-----------:|---------:|------------:|----------|
| 2026-10-22 | Local (Docker Compose, `RATE_LIMIT_MAX=100000`) | búsqueda | 3 471 | 13.86 | 0.00 | Sí |
| 2026-10-22 | Local (Docker Compose, `RATE_LIMIT_MAX=100000`) | ranking | 3 471 | 13.34 | 0.00 | Sí |
| | AWS (DNS del ALB) | búsqueda | | | | |
| | AWS (DNS del ALB) | ranking | | | | |

Total local: 6 942 peticiones en 80 s (≈ 89 peticiones/s), 100 % de verificaciones correctas.
Salida completa de k6 en [`resultados/salida-local.txt`](resultados/salida-local.txt) y
métricas en [`resultados/resumen-local.json`](resultados/resumen-local.json).

Reproducir en local:

```bash
# En .env: RATE_LIMIT_MAX=100000, luego
docker compose up -d --build
docker run --rm --add-host=host.docker.internal:host-gateway   -e BASE_URL=http://host.docker.internal:8080   -v "$PWD/tests/carga:/carga" grafana/k6:0.54.0 run /carga/busqueda-y-ranking.js
```

> Un entorno local en un solo equipo no tiene latencia de red real. La fila de AWS se completa
> después del despliegue con `-e BASE_URL=http://<dns-del-alb>` (restaurando el límite normal
> del gateway después de la prueba).
