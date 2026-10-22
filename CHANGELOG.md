# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado
sigue [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado

- Estructura base del repositorio, guía de contribución y plantillas de GitHub.
- Documentación de arquitectura: requerimientos y drivers, arquitectura lógica, despliegue
  (diagrama UML), contratos OpenAPI de Libros y Ventas y registro de decisiones (ADR-001 a ADR-006).
- Plan de trabajo con reparto de componentes, ramas y criterios de aceptación.
- API Gateway: enrutamiento en *streaming*, autenticación de administrador, bloqueo de rutas
  internas, límite de peticiones, trazabilidad con `X-Request-Id`, salud agregada y errores uniformes.
- Pruebas automatizadas del gateway (57 casos) y flujo de integración continua.
- `docker-compose.yml` con la topología local equivalente a AWS.

### Corregido

- El historial de ventas quedaba público porque la política de acceso se evaluaba sin el prefijo `/api`.
