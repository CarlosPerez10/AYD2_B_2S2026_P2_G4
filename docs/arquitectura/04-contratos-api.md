# 04 · Contratos de API

Los contratos completos están en formato OpenAPI 3.0:

- [`docs/api/libros.openapi.yaml`](../api/libros.openapi.yaml)
- [`docs/api/ventas.openapi.yaml`](../api/ventas.openapi.yaml)

Se pueden visualizar pegándolos en <https://editor.swagger.io>.

## 1. Convenciones

| Convención | Regla |
|------------|-------|
| Prefijo | `/api/v1` para rutas públicas, `/internal/v1` para rutas entre servicios. |
| Formato | JSON con `Content-Type: application/json; charset=utf-8`. |
| Nombres | Recursos en plural y en español (`/libros`, `/ventas`); campos en *camelCase*. |
| Respuesta exitosa | `{ "data": ... }`, y `{ "data": [...], "meta": {...} }` en listados. |
| Paginación | `?pagina=1&limite=20`; máximo 100 elementos por página. |
| Fechas | ISO 8601 en UTC (`2026-10-20T15:04:05.000Z`). |
| Montos | Número con dos decimales, en quetzales. |
| Trazabilidad | Toda respuesta incluye el encabezado `X-Request-Id`. |

## 2. Rutas expuestas por la API Gateway

| Método | Ruta | Destino | Llave admin |
|--------|------|---------|:-----------:|
| GET | `/health` | Gateway | |
| GET | `/health/servicios` | Gateway (consulta `/health` de cada servicio) | |
| GET | `/api/v1/libros` | Libros | |
| GET | `/api/v1/libros/autores` | Libros | |
| GET | `/api/v1/libros/{id}` | Libros | |
| POST | `/api/v1/libros` | Libros | ● |
| PUT | `/api/v1/libros/{id}` | Libros | ● |
| DELETE | `/api/v1/libros/{id}` | Libros | ● |
| GET | `/api/v1/ventas/ranking` | Ventas | |
| GET | `/api/v1/ventas` | Ventas | ● |
| GET | `/api/v1/ventas/{id}` | Ventas | ● |
| POST | `/api/v1/ventas` | Ventas | ● |
| * | `/internal/*` | **Bloqueado** (`404`) | — |

> En los microservicios, las rutas estáticas (`/autores`, `/ranking`) deben declararse antes
> de las rutas con parámetro (`/:id`) para que Express no las interprete como un id.

## 3. Ejemplos

### Buscar libros

```http
GET /api/v1/libros?q=garcia&disponibles=true&orden=-precio&limite=5
```

```json
{
  "data": [
    {
      "id": 7,
      "isbn": "9788437604572",
      "titulo": "Cien años de soledad",
      "autor": "Gabriel García Márquez",
      "precio": 189.5,
      "existencias": 12,
      "creadoEn": "2026-10-18T16:20:11.000Z",
      "actualizadoEn": "2026-10-20T09:02:45.000Z"
    }
  ],
  "meta": { "pagina": 1, "limite": 5, "total": 1, "totalPaginas": 1 }
}
```

### Registrar una venta

```http
POST /api/v1/ventas
X-Api-Key: <llave de administración>
Content-Type: application/json

{ "libroId": 7, "cantidad": 2 }
```

```json
{
  "data": {
    "id": 31,
    "libroId": 7,
    "titulo": "Cien años de soledad",
    "autor": "Gabriel García Márquez",
    "cantidad": 2,
    "precioUnitario": 189.5,
    "total": 379,
    "fecha": "2026-10-20T15:04:05.000Z"
  }
}
```

### Ranking

```http
GET /api/v1/ventas/ranking?limite=3&desde=2026-10-01
```

```json
{
  "data": [
    { "posicion": 1, "libroId": 7, "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "unidadesVendidas": 42, "montoTotal": 7959 },
    { "posicion": 2, "libroId": 3, "titulo": "La casa de los espíritus", "autor": "Isabel Allende", "unidadesVendidas": 30, "montoTotal": 4650 },
    { "posicion": 3, "libroId": 12, "titulo": "Rayuela", "autor": "Julio Cortázar", "unidadesVendidas": 18, "montoTotal": 2970 }
  ],
  "meta": { "limite": 3, "desde": "2026-10-01T00:00:00.000Z", "hasta": null, "generadoEn": "2026-10-20T15:10:00.000Z" }
}
```

## 4. Errores

Todos los componentes responden errores con la misma forma:

```json
{
  "error": {
    "codigo": "EXISTENCIAS_INSUFICIENTES",
    "mensaje": "Solo hay 2 unidades disponibles de \"Rayuela\".",
    "detalles": { "disponibles": 2, "solicitadas": 5 },
    "requestId": "9b7c1f3e-0f5a-4f5e-8f0a-2c1d3e4f5a6b"
  }
}
```

| HTTP | `codigo` | Emisor | Cuándo |
|------|----------|--------|--------|
| 400 | `VALIDACION` | Servicios | Parámetros o cuerpo inválidos. `detalles` lista `{campo, mensaje}`. |
| 401 | `NO_AUTORIZADO` | Gateway | Falta `X-Api-Key` o es incorrecta. |
| 404 | `NO_ENCONTRADO` | Todos | Recurso o ruta inexistente. |
| 409 | `CONFLICTO` | Libros | ISBN duplicado. |
| 409 | `EXISTENCIAS_INSUFICIENTES` | Libros / Ventas | La cantidad supera las existencias. |
| 413 | `CUERPO_DEMASIADO_GRANDE` | Servicios | Cuerpo mayor a 100 KB. |
| 429 | `DEMASIADAS_PETICIONES` | Gateway | Se superó el límite por IP (por defecto 300 por minuto). |
| 500 | `ERROR_INTERNO` | Todos | Error no controlado. El mensaje nunca expone detalles internos. |
| 502 | `SERVICIO_NO_DISPONIBLE` | Gateway | El microservicio rechazó la conexión. |
| 503 | `SERVICIO_NO_DISPONIBLE` | Gateway / Ventas | Microservicio o dependencia caída. |
| 504 | `TIEMPO_AGOTADO` | Gateway | El microservicio no respondió dentro del tiempo límite. |
