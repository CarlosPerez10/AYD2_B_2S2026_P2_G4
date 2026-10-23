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
| **Express + proxy propio sobre `node:http`** | Mismo lenguaje que el backend, se puede probar con pruebas automatizadas, corre igual en local y en AWS, sin dependencias de proxy | Un componente más que operar; el proxy es código propio que hay que mantener. |

## Decisión

Construir la gateway con Express y un proxy propio sobre el módulo `node:http`, empaquetada en Docker y
desplegada en la VM de frontend detrás del ALB. El ALB enruta `/api/*` y `/health*` a la
gateway y el resto al frontend.

## Consecuencias

- Toda la política del borde (rutas, llaves, límites, CORS) vive en código versionado y probado.
- El proxy trabaja en *streaming*: el gateway no interpreta el cuerpo de las peticiones.
- Se descartó `http-proxy-middleware` porque depende de `http-proxy`, sin mantenimiento, y de
  `micromatch`/`braces`, con vulnerabilidades altas reportadas por `npm audit`. El proxy propio
  ocupa menos de 150 líneas y su comportamiento ante fallos (503/504/502) queda explícito y probado.
- Para alta disponibilidad real se requeriría más de una instancia; queda documentado como evolución.
