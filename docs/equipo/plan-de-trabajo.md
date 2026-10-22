# Plan de trabajo — Grupo 4

## 1. Reparto por componente

Cada integrante es dueño de un componente y lo desarrolla en sus propias ramas. Los
contratos de [`04-contratos-api.md`](../arquitectura/04-contratos-api.md) son el acuerdo entre
componentes: si alguien necesita cambiarlos, abre un issue y lo revisa el arquitecto antes de
implementar.

| Integrante | Carnet | Componente | Entregables |
|------------|--------|-----------|-------------|
| Carlos Javier Pérez Pocón | 202206425 | Arquitectura e integración | Documentos 01–04, ADR, diagrama UML de despliegue, API Gateway, `docker-compose.yml`, revisión de PR, releases |
| Luis Fernando González | 202307727 | Microservicio de Libros | Servicio en capas, migraciones y datos semilla, búsqueda y filtrado, API interna de existencias, Dockerfile, pruebas |
| Eduardo Misael López Ávila | 202100147 | Microservicio de Ventas | Servicio en capas, cliente de Libros, saga de registro con compensación, ranking, Dockerfile, pruebas |
| Kevin Mark Hernández Chicol | 202001053 | Frontend | Vistas de catálogo, búsqueda/filtros, detalle, ranking y administración; Dockerfile con Nginx; manual de usuario |
| Billy James Asael Chamale Sánchez | 201907502 | Infraestructura | Módulos de Terraform, roles de Ansible, script de build y push a ECR, despliegue y guía de despliegue |

## 2. Ramas por integrante

Todas se crean desde `develop` y vuelven a `develop` por Pull Request.

### Carlos — 202206425

- `chore/estructura-base_202206425`
- `docs/requerimientos_202206425`
- `docs/arquitectura-logica_202206425`
- `docs/contratos-api_202206425`
- `docs/arquitectura-despliegue_202206425`
- `docs/plan-de-trabajo_202206425`
- `feature/api-gateway_202206425`
- `tests/api-gateway_202206425`
- `chore/docker-compose_202206425`
- `release/v0.1.0`, `release/v0.2.0`, `release/v1.0.0`

### Luis — 202307727

- `feature/libros-base_202307727` — estructura en capas, configuración, `/health`
- `feature/libros-persistencia_202307727` — pool `pg`, migraciones, datos semilla
- `feature/libros-crud_202307727` — crear, obtener, actualizar, eliminar
- `feature/libros-busqueda_202307727` — `q`, `autor`, rango de precio, disponibles, orden, paginación
- `feature/libros-existencias_202307727` — `/internal/v1/libros/:id/descontar` y `/reponer` atómicos
- `build/libros-docker_202307727`
- `tests/libros_202307727`

### Eduardo — 202100147

- `feature/ventas-base_202100147`
- `feature/ventas-persistencia_202100147`
- `feature/ventas-cliente-libros_202100147` — cliente HTTP con tiempo límite y mapeo de errores
- `feature/ventas-registro_202100147` — saga: consultar → descontar → guardar → compensar
- `feature/ventas-ranking_202100147`
- `build/ventas-docker_202100147`
- `tests/ventas_202100147`
- `tests/prueba_carga_202100147` — prueba de carga del ranking y la búsqueda (k6 o autocannon)

### Kevin — 202001053

- `feature/frontend-base_202001053` — Vite + React, enrutador, layout, cliente HTTP
- `feature/frontend-catalogo_202001053`
- `feature/frontend-busqueda_202001053`
- `feature/frontend-detalle_202001053`
- `feature/frontend-ranking_202001053`
- `feature/frontend-admin_202001053` — formularios de libros y ventas con llave de administración
- `build/frontend-docker_202001053` — build multi-etapa y `nginx.conf`
- `docs/manual-usuario_202001053`

### Billy — 201907502

- `infra/terraform-red_201907502`
- `infra/terraform-seguridad_201907502`
- `infra/terraform-computo_201907502`
- `infra/terraform-balanceador_201907502`
- `infra/terraform-base-datos_201907502`
- `infra/terraform-registro_201907502`
- `infra/ansible-base_201907502` — roles `comun`, `docker`, `ecr_login`
- `infra/ansible-despliegue_201907502` — roles de despliegue por VM
- `ci/build-push-ecr_201907502`
- `docs/guia-despliegue_201907502`

## 3. Criterios de aceptación por componente

### API Gateway (Carlos)

- [ ] Enruta `/api/v1/libros*` y `/api/v1/ventas*` sin reescribir rutas y en *streaming*.
- [ ] Bloquea `/internal/*` con `404`.
- [ ] Exige `X-Api-Key` según la tabla de rutas; comparación en tiempo constante.
- [ ] Propaga `X-Request-Id` y registra cada petición en JSON.
- [ ] Traduce errores de conexión a `503`, tiempo agotado a `504`, resto a `502`.
- [ ] `GET /health/servicios` informa el estado de cada microservicio.
- [ ] Pruebas automatizadas con servidores simulados.

### Libros (Luis)

- [ ] Cumple `libros.openapi.yaml`.
- [ ] Búsqueda insensible a mayúsculas y tildes (`unaccent` + `ILIKE` o `pg_trgm`).
- [ ] Descuento de existencias en una sola sentencia `UPDATE ... WHERE existencias >= $1 RETURNING *`.
- [ ] Migraciones idempotentes al arrancar y al menos 25 libros semilla.
- [ ] Pruebas de validadores y servicios; pruebas de rutas con repositorio simulado.

### Ventas (Eduardo)

- [ ] Cumple `ventas.openapi.yaml`.
- [ ] Guarda copia de título, autor y precio en cada venta.
- [ ] Compensa existencias si falla la inserción.
- [ ] Ranking con desempate estable (unidades, monto, título) y filtro por fechas.
- [ ] Pruebas de la saga con el cliente de Libros simulado (éxito, 404, 409, 503, falla al guardar).

### Frontend (Kevin)

- [ ] Solo consume la API Gateway, con URL base configurable.
- [ ] Búsqueda con espera de 300 ms y filtros combinables.
- [ ] Estados de carga, vacío y error en cada vista.
- [ ] Diseño adaptable a celular.
- [ ] Manual de usuario con capturas en `docs/manuales/`.

### Infraestructura (Billy)

- [ ] `terraform fmt -check` y `terraform validate` sin errores.
- [ ] IP elásticas para las tres VMs, ALB con reglas por ruta, dos RDS privadas, cuatro repositorios ECR.
- [ ] `ansible-playbook site.yml` idempotente (segunda ejecución sin cambios).
- [ ] Despliegue completo desde cero siguiendo la guía.

## 4. Releases

| Versión | Contenido | Condición para cerrar |
|---------|-----------|-----------------------|
| `v0.1.0` | Arquitectura, contratos, API Gateway, microservicios de Libros y Ventas funcionando con `docker compose` | Todas las pruebas de backend pasan; `docker compose up` levanta el backend |
| `v0.2.0` | Frontend completo y módulos de Terraform y Ansible | Sistema completo en local; `terraform validate` y `ansible-lint` sin errores |
| `v1.0.0` | Despliegue en AWS, manual de usuario y guía de despliegue | Plataforma accesible por el DNS del ALB; documentación completa |

Proceso de cada release (lo ejecuta el coordinador):

1. `git switch -c release/vX.Y.Z develop`
2. Actualizar `CHANGELOG.md` y versiones en `package.json`.
3. PR de `release/vX.Y.Z` → `main`; merge con `--no-ff`.
4. `git tag -a vX.Y.Z -m "Release vX.Y.Z"` y publicar el release en GitHub.
5. Merge de `main` → `develop` para sincronizar.

## 5. Cronograma

| Fecha | Hito |
|-------|------|
| 15 oct | Enunciado; repositorio creado; auxiliar agregado |
| 16 – 17 oct | Arquitectura, contratos y estructura base en `develop` |
| 17 – 19 oct | Microservicios, gateway y frontend en paralelo; Terraform en paralelo |
| 19 oct | **v0.1.0** |
| 20 oct | Ansible, integración del frontend |
| 21 oct | **v0.2.0**; primer despliegue en AWS |
| 22 oct | **v1.0.0**; entrega |
| 24 oct | Calificación: cada integrante explica su componente |

## 6. Reglas de colaboración

- Cada quien hace commits **pequeños y frecuentes** en sus ramas, con el formato de [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Cada PR lo revisa al menos otro integrante; el arquitecto revisa todos los que tocan contratos.
- Nadie modifica el componente de otro sin coordinarlo en el issue correspondiente.
- Todos deben poder explicar su código el día de la calificación.
