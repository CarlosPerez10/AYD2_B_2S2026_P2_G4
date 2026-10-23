# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado
sigue [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

## [0.1.0] - 2026-10-22

Primera versión funcional: la plataforma completa corre en local con `docker compose`.

### Agregado

- Estructura base del repositorio, guía de contribución y plantillas de GitHub.
- Documentación de arquitectura: requerimientos y drivers, arquitectura lógica, despliegue
  (diagrama UML), contratos OpenAPI de Libros y Ventas y registro de decisiones (ADR-001 a ADR-006).
- Plan de trabajo y guía de tareas por integrante.
- **API Gateway**: enrutamiento en *streaming*, autenticación de administrador, bloqueo de rutas
  internas, límite de peticiones, trazabilidad con `X-Request-Id`, salud agregada y errores uniformes.
- **Microservicio de Libros**: catálogo con búsqueda sin tildes ni mayúsculas, filtros por autor,
  precio y disponibilidad, orden y paginación; administración de libros; descuento y reposición
  atómicos de existencias; migraciones y 30 libros semilla.
- **Microservicio de Ventas**: registro de ventas con saga y compensación hacia Libros, historial
  paginado y ranking de más vendidos con filtro por fechas.
- **Frontend**: catálogo, búsqueda y filtros en la URL, detalle, más vendidos y administración
  de libros y ventas; servido por Nginx.
- Manual de usuario (estructura) y prueba de carga con k6 (escenario).
- `docker-compose.yml` con la topología local equivalente a AWS.
- Integración continua para gateway, Libros, Ventas y frontend.

### Corregido

- El historial de ventas quedaba público porque la política de acceso se evaluaba sin el prefijo `/api`.
- Libros, Ventas y frontend no tenían `package-lock.json`: `npm ci` fallaba en Docker y en CI.
- `react-router-dom` 6 tenía dos vulnerabilidades moderadas; se actualizó a v7.
- Un libro renombrado aparecía dos veces en el ranking; ahora se agrupa por `libro_id`.
- Nginx resolvía el gateway solo al arrancar; ahora lo resuelve en cada petición.
- El mensaje de existencias insuficientes no concordaba en número ("1 unidades").

[Sin publicar]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v0.1.0...develop
[0.1.0]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/releases/tag/v0.1.0
