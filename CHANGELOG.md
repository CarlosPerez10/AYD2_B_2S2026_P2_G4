# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado
sigue [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

## [1.0.2] - 2026-10-22

### Corregido

- `build-push-ecr` quedaba en rojo en cada tag porque el repositorio no tiene credenciales
  de AWS; ahora omite la publicación con un aviso.
- Advertencias de `actionlint` en los workflows de verificación de imágenes.

## [1.0.1] - 2026-10-22

### Corregido

- `desplegar.sh` fallaba con *no vault secrets found* al esperar la conexión SSH: la
  contraseña de Vault ahora se pide una sola vez y sirve para todos los comandos de Ansible.

## [1.0.0] - 2026-10-22

Versión lista para desplegar en AWS.

### Agregado

- `infra/scripts/preparar-wsl.sh`: instala Terraform, AWS CLI v2, Ansible y jq en Ubuntu/WSL.
- `infra/scripts/desplegar.sh`: despliegue completo con un comando (Terraform → ECR → Ansible),
  con verificación previa de herramientas, credenciales, secretos y permisos de la llave SSH.
- `infra/scripts/destruir.sh`: elimina la infraestructura con confirmación.
- Guía de despliegue paso a paso para Windows + WSL y AWS Academy, con lista de evidencias.
- Límite de peticiones del gateway configurable desde Ansible para pruebas de carga en AWS.

### Cambiado

- Todos los componentes pasan a la versión 1.0.0.

## [0.2.0] - 2026-10-22

Infraestructura como código validada, documentación alineada con la metodología del curso y
evidencias de calidad.

### Agregado

- **Terraform**: módulos de red, seguridad, cómputo con IP elásticas, balanceador, RDS y ECR,
  con lock de proveedores para Linux, Windows y macOS.
- **Ansible**: roles `comun`, `docker`, `ecr_login` y despliegue por VM; script de inventario
  desde `terraform output`.
- Script y workflow de *build* y *push* de las cuatro imágenes a ECR.
- Guía de despliegue en AWS.
- Diagramas UML en PlantUML: casos de uso del negocio, CDU de alto nivel y primera
  descomposición, componentes con interfaces, bloques con bus de eventos y distribución.
- Requerimientos: características del sistema, modelo de casos de uso del negocio (CUN),
  campos resumen, prioridad y mejoras en los CDU expandidos y matriz CUN ↔ CU.
- Capturas reales en el manual de usuario.
- Resultados de la prueba de carga local: p95 de 13.86 ms (búsqueda) y 13.34 ms (ranking), 0 % de errores.
- CI de infraestructura (`terraform validate` y `ansible-lint` con perfil *production*).
- `RATE_LIMIT_MAX` configurable desde `.env` para pruebas de carga.

### Corregido

- `apt_repository` (obsoleto, se elimina en ansible-core 2.25) reemplazado por `deb822_repository`.
- Variables de roles de Ansible sin prefijo y hosts con el mismo nombre que su grupo.
- `vault.yml` queda fuera del repositorio aunque esté cifrado.

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

[Sin publicar]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v1.0.2...develop
[1.0.2]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CarlosPerez10/AYD2_B_2S2026_P2_G4/releases/tag/v0.1.0
