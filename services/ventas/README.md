# Microservicio de Ventas

Responsable: **Eduardo Misael López Ávila** (202100147)

Registra las transacciones de venta y calcula el ranking de los libros más vendidos.
Para registrar una venta coordina con el microservicio de Libros una saga con
compensación (ver [ADR-004](../../docs/arquitectura/adr/ADR-004-comunicacion-sincrona-con-compensacion.md)).

- Contrato: [`docs/api/ventas.openapi.yaml`](../../docs/api/ventas.openapi.yaml)
- Puerto interno: `3002`
- Base de datos: PostgreSQL `ventas_db` (Amazon RDS en la nube)

## Estructura

```
src/
├── app.js / server.js
├── config/              # variables validadas al arrancar (incluye LIBROS_SERVICE_URL)
├── clients/             # librosClient.js: fetch con tiempo límite y mapeo de errores
├── routes/              # /health, /api/v1/ventas (ranking declarado antes de /:id)
├── controllers/
├── validators/          # venta, historial y ranking
├── services/            # saga de registro y ranking
├── repositories/        # SQL parametrizado con `pg`
├── db/                  # pool, migraciones, semilla de ventas de ejemplo
└── utils/               # logger JSON y catálogo de errores
```

## Registro de una venta (saga)

1. `GET /api/v1/libros/:id` en Libros → precio, título y autor vigentes.
2. `POST /internal/v1/libros/:id/descontar` → `409` corta la saga sin guardar nada.
3. `INSERT` en `venta` con una copia de título, autor y precio; `total` se calcula en centavos.
4. Si el `INSERT` falla → `POST /internal/v1/libros/:id/reponer` y respuesta `500`.
   Si la reposición también falla se registra un log `CRITICO` (con `critico: true` y todos
   los datos de la venta) para corregir las existencias a mano.

| Respuesta de Libros | Respuesta de Ventas |
|---------------------|---------------------|
| `404` | `404 NO_ENCONTRADO` |
| `409` | `409 EXISTENCIAS_INSUFICIENTES` (conserva `detalles`) |
| Sin conexión, tiempo agotado (3 s) o `5xx` | `503 SERVICIO_NO_DISPONIBLE` |

El ranking (`GET /api/v1/ventas/ranking`) se calcula solo con `ventas_db`, así que funciona
aunque Libros esté caído.

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | `3002` | Puerto HTTP. |
| `NODE_ENV`, `APP_VERSION`, `LOG_LEVEL` | `development`, `0.1.0`, `debug`/`info` | Igual que Libros. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `ventas_db`, `ventas`, — | Conexión a PostgreSQL. |
| `DB_SSL`, `DB_SSL_CA`, `DB_POOL_MAX` | `false`, bundle de RDS, `10` | TLS hacia RDS y tamaño del pool. |
| `LIBROS_SERVICE_URL` | `http://localhost:3001` | URL interna de Libros (`http://libros:3001` en Compose). |
| `LIBROS_TIMEOUT_MS` | `3000` | Tiempo límite de cada llamada a Libros. |

## Ejecutar y probar

```bash
cd services/ventas
npm install            # genera package-lock.json (necesario para el Dockerfile)
cp .env.example .env
npm run dev
npm test
```

Las pruebas no necesitan PostgreSQL ni Libros: usan un repositorio en memoria, un cliente de
Libros simulado (éxito, 404, 409, 503 y falla al guardar) y un `fetch` simulado.

La semilla (`src/db/semilla.sql`) inserta ventas de ejemplo con los `libro_id` de la semilla de
Libros para que el ranking tenga datos desde el inicio. Son datos históricos y no descuentan
existencias.
