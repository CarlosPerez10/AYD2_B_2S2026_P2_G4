# Frontend

Responsable: **Kevin Mark Hernández Chicol** (202001053)

Aplicación web que consume la API Gateway para mostrar el catálogo, la búsqueda/filtrado y
el ranking de los libros más vendidos, y para administrar libros y ventas.

- Vite + React 18 + React Router 6.
- Consume únicamente la API Gateway con rutas relativas (`/api/v1/...`).
- Puerto del contenedor: `80` (Nginx).

## Vistas

| Ruta | Vista |
|------|-------|
| `/` | Catálogo con búsqueda (espera de 300 ms), filtros por autor, precio, disponibilidad y orden, y paginación. Los filtros viven en la URL. |
| `/libros/:id` | Detalle del libro; "Volver" conserva la búsqueda. |
| `/mas-vendidos` | Top 5/10/20 con filtro de fechas y gráfico de barras en CSS. |
| `/administracion` | Llave de administración (en `sessionStorage`), alta/edición/eliminación de libros, registro de ventas e historial. |

Cada vista tiene estados de carga, vacío y error. Los errores muestran el `requestId`
para buscarlo en los logs. En pantallas angostas las tablas se muestran como tarjetas.

## Estructura

```
src/
├── api/            # cliente.js (fetch + { data, meta } / { error }), libros.js, ventas.js
├── components/     # Layout, TarjetaLibro, Cargando, MensajeError, EstadoVacio, Paginacion
├── hooks/          # useConsulta (carga con cancelación), useDebounce, useSesionAdmin
├── pages/          # Catalogo, DetalleLibro, MasVendidos, Administracion, admin/*
├── utils/          # formato de precios y fechas, validación del formulario de libros
└── estilos.css
```

## Desarrollo

```bash
cd frontend
npm install          # genera package-lock.json (lo necesita el Dockerfile)
npm run dev          # http://localhost:5173, /api se reenvía a http://localhost:8080
```

Para apuntar a otro gateway: `VITE_GATEWAY_URL=http://otra-ip:8080 npm run dev`.

## Imagen

`Dockerfile` multi-etapa: `node:22-alpine` construye y `nginx:1.27-alpine` sirve `dist/`.
`nginx.conf` reenvía `/api/` al contenedor `api-gateway:8080`, cachea `/assets/` un año y
responde `index.html` para las rutas del enrutador.

```bash
docker compose up --build    # desde la raíz → http://localhost:8081
```

## Notas

- El selector de libros de "Registrar venta" carga hasta 100 libros (máximo por página del
  contrato); con un catálogo mayor habría que agregar búsqueda en ese selector.
- "Hasta" en el ranking es inclusivo para el usuario; el frontend envía el día siguiente
  porque la API lo trata como límite exclusivo.
