# ADR-002 · API Gateway propia con Express

- **Estado:** Aceptada
- **Fecha:** 2026-10-15

## Contexto

Se necesita un punto de entrada único que enrute hacia Libros y Ventas, bloquee rutas
internas, autentique operaciones de administración y unifique errores. Las alternativas
evaluadas fueron Amazon API Gateway, Nginx como proxy inverso y una gateway propia en Node.js.

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| Amazon API Gateway | Gestionado, escalable | Difícil de reproducir en local; la lógica queda fuera del repositorio; costo por petición. |
| Nginx | Muy eficiente | Lógica de autenticación y agregación de salud poco expresiva en configuración. |
| **Express + http-proxy-middleware** | Mismo lenguaje que el backend, probable con pruebas automatizadas, corre igual en local y en AWS | Un componente más que operar. |

## Decisión

Construir la gateway con Express y `http-proxy-middleware`, empaquetada en Docker y
desplegada en la VM de frontend detrás del ALB. El ALB enruta `/api/*` y `/health*` a la
gateway y el resto al frontend.

## Consecuencias

- Toda la política del borde (rutas, llaves, límites, CORS) vive en código versionado y probado.
- El proxy trabaja en *streaming*: el gateway no interpreta el cuerpo de las peticiones.
- Para alta disponibilidad real se requeriría más de una instancia; queda documentado como evolución.
