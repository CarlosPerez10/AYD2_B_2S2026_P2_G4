# Diagramas

Todos los diagramas están hechos en **draw.io** con figuras UML. Cada uno tiene su fuente
editable (`.drawio`) y su imagen (`.png`), que es la que se muestra en los documentos.

| Diagrama | Tipo UML | Fuente | Documento |
|----------|----------|--------|-----------|
| Modelo de casos de uso del negocio | Casos de uso (negocio) | [`cun-negocio.drawio`](cun-negocio.drawio) | [01 §4](../arquitectura/01-requerimientos.md#4-modelo-de-casos-de-uso-del-negocio) |
| CDU alto nivel — core | Casos de uso | [`cdu-alto-nivel.drawio`](cdu-alto-nivel.drawio) | [01 §5.1](../arquitectura/01-requerimientos.md#51-core-del-sistema) |
| CDU primera descomposición | Casos de uso | [`cdu-primera-descomposicion.drawio`](cdu-primera-descomposicion.drawio) | [01 §5.2](../arquitectura/01-requerimientos.md#52-primera-descomposición) |
| Bloques por capas | Bloques | [`bloques.drawio`](bloques.drawio) | [02 §2](../arquitectura/02-arquitectura.md#2-diagrama-de-bloques) |
| Bloques con bus de eventos | Bloques | [`bloques-eventos.drawio`](bloques-eventos.drawio) | [02 §2.1](../arquitectura/02-arquitectura.md#21-perspectiva-basada-en-eventos) |
| Capas de cada microservicio | Perspectiva lógica | [`capas-microservicio.drawio`](capas-microservicio.drawio) | [02 §3](../arquitectura/02-arquitectura.md#3-perspectiva-lógica-capas-de-cada-microservicio) |
| Componentes | Componentes | [`componentes.drawio`](componentes.drawio) | [02 §4](../arquitectura/02-arquitectura.md#4-diagrama-de-componentes) |
| Modelo de persistencia | Datos | [`modelo-datos.drawio`](modelo-datos.drawio) | [02 §5](../arquitectura/02-arquitectura.md#5-modelo-de-persistencia) |
| Registrar venta | Secuencia | [`secuencia-venta.drawio`](secuencia-venta.drawio) | [02 §6](../arquitectura/02-arquitectura.md#6-flujo-de-registro-de-una-venta) |
| **Despliegue** | Despliegue | [`despliegue.drawio`](despliegue.drawio) | [03 §2](../arquitectura/03-despliegue.md#2-diagrama-uml-de-despliegue) |
| Distribución | Despliegue (ubicación física) | [`distribucion.drawio`](distribucion.drawio) | [03 §2.2](../arquitectura/03-despliegue.md#22-diagrama-de-distribución) |
| Flujo de despliegue | Secuencia | [`flujo-despliegue.drawio`](flujo-despliegue.drawio) | [03 §6](../arquitectura/03-despliegue.md#6-flujo-de-despliegue) |
| Vista general | Bloques | [`arquitectura-general.drawio`](arquitectura-general.drawio) | [README](../../README.md#arquitectura) |
| Cadena de middlewares | Actividad | [`gateway-middlewares.drawio`](gateway-middlewares.drawio) | [api-gateway/README](../../api-gateway/README.md#cadena-de-middlewares) |
| Dependencias del equipo | Bloques | [`dependencias-equipo.drawio`](dependencias-equipo.drawio) | [Tareas §7](../equipo/tareas-por-integrante.md#7-dependencias-entre-integrantes) |

## Editar un diagrama

1. Abrir el `.drawio` en <https://app.diagrams.net> o en draw.io Desktop (*Archivo → Abrir*).
2. Editar y guardar.
3. Exportar con *Archivo → Exportar como → PNG* (zoom 200 %, borde 20) y reemplazar el `.png`
   del mismo nombre.
