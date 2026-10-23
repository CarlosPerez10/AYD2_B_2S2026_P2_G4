# Microservicio de Libros

Responsable: **Luis Fernando González** (202307727)

Gestiona el catálogo: título, autor, precio y existencias. Expone las operaciones de
consulta, búsqueda y filtrado de libros, y una API interna para que Ventas descuente y
reponga existencias.

- Contrato: [`docs/api/libros.openapi.yaml`](../../docs/api/libros.openapi.yaml)
- Puerto interno: `3001`
- Base de datos: PostgreSQL `libros_db` (Amazon RDS en la nube)

## Estructura

```
src/
├── app.js                 # composición de middlewares y rutas
├── server.js              # arranque: configuración, migraciones, apagado ordenado
├── config/                # variables de entorno validadas al arrancar
├── middlewares/           # requestId, registro de peticiones, errores
├── routes/                # /health, /api/v1/libros, /internal/v1/libros
├── controllers/           # traduce HTTP ↔ servicio
├── validators/            # reglas de entrada (cuerpo, filtros, ids)
├── services/              # reglas de negocio (404, 409, existencias)
├── repositories/          # SQL parametrizado con `pg`
├── db/
│   ├── pool.js            # pool de conexiones (TLS hacia RDS si DB_SSL=true)
│   ├── migrar.js          # aplica migraciones pendientes y la semilla
│   ├── migraciones/       # 001 tabla libro, 002 índices de búsqueda
│   └── semilla.sql        # 30 libros, solo si la tabla está vacía
└── utils/                 # logger JSON y catálogo de errores
```

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio y `SELECT 1` a la base. |
| `GET` | `/api/v1/libros` | Listado con `q`, `autor`, `precioMin`, `precioMax`, `disponibles`, `orden`, `pagina`, `limite`. |
| `GET` | `/api/v1/libros/autores` | Autores distintos, ordenados. |
| `GET` | `/api/v1/libros/:id` | Detalle. |
| `POST` | `/api/v1/libros` | Crear (la llave la valida el gateway). |
| `PUT` | `/api/v1/libros/:id` | Reemplazar datos. |
| `DELETE` | `/api/v1/libros/:id` | Eliminar. |
| `POST` | `/internal/v1/libros/:id/descontar` | Resta existencias de forma atómica (`409 EXISTENCIAS_INSUFICIENTES` si no alcanzan). |
| `POST` | `/internal/v1/libros/:id/reponer` | Suma existencias (compensación de Ventas). |

La búsqueda no distingue mayúsculas ni tildes: `garcia` encuentra "García Márquez".
Usa `f_unaccent(lower(...)) LIKE` con índices GIN de `pg_trgm`.

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | `3001` | Puerto HTTP. |
| `NODE_ENV` | `development` | En `production` se exige `DB_PASSWORD`. |
| `APP_VERSION` | `0.1.0` | Se informa en `/health`. |
| `LOG_LEVEL` | `debug` / `info` | `debug`, `info`, `warn` o `error`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `libros_db`, `libros`, — | Conexión a PostgreSQL. |
| `DB_SSL` | `false` | `true` en AWS: conexión TLS validando el certificado de RDS. |
| `DB_SSL_CA` | `/app/certs/global-bundle.pem` | Bundle de RDS (incluido en la imagen). |
| `DB_POOL_MAX` | `10` | Conexiones máximas del pool. |

## Ejecutar

```bash
cd services/libros
npm install            # genera package-lock.json (necesario para el Dockerfile)
cp .env.example .env   # requiere un PostgreSQL local
npm run dev
```

Con todo el sistema, desde la raíz: `docker compose up --build libros`.

Al arrancar, el servicio aplica las migraciones pendientes (tabla `migracion`) y, si la
tabla `libro` está vacía, inserta la semilla.

## Pruebas

```bash
npm test
npm run test:coverage
```

No necesitan base de datos: el servicio y las rutas se prueban con un repositorio en
memoria y el SQL del repositorio con un pool simulado.
