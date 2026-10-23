# ADR-005 · Autenticación de administrador en el gateway

- **Estado:** Aceptada
- **Fecha:** 2026-10-17

## Contexto

El enunciado distingue personal administrativo y clientes, pero no pide gestión de usuarios.
Las consultas son públicas; crear, editar o eliminar libros y registrar ventas solo debe
hacerlo el personal.

## Decisión

La API Gateway exige el encabezado `X-Api-Key` con la llave de administración en todo
método distinto de `GET`, `HEAD` y `OPTIONS`, y en `GET /api/v1/ventas` (historial). La
comparación se hace en tiempo constante. La llave se inyecta por variable de entorno
(`ADMIN_API_KEY`), que Ansible obtiene del inventario cifrado con Ansible Vault. En modo
producción el gateway no arranca sin llave configurada.

## Consecuencias

- Los microservicios no implementan autenticación y quedan protegidos por red: solo aceptan tráfico desde el gateway.
- No hay usuarios individuales ni auditoría por persona; si se necesitara, la evolución es emitir JWT desde un servicio de identidad y validarlos en el mismo middleware.
