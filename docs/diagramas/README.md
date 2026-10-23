# Diagramas

Fuentes en PlantUML (`.puml`) y versión renderizada (`.svg`) que se muestra en los documentos.

| Diagrama | Tipo UML | Fuente | Documento |
|----------|----------|--------|-----------|
| Modelo de casos de uso del negocio | Casos de uso (negocio) | [`cun-negocio.puml`](cun-negocio.puml) | [01 §4](../arquitectura/01-requerimientos.md#4-modelo-de-casos-de-uso-del-negocio) |
| CDU alto nivel — core | Casos de uso | [`cdu-alto-nivel.puml`](cdu-alto-nivel.puml) | [01 §5.1](../arquitectura/01-requerimientos.md#51-core-del-sistema) |
| CDU primera descomposición | Casos de uso | [`cdu-primera-descomposicion.puml`](cdu-primera-descomposicion.puml) | [01 §5.2](../arquitectura/01-requerimientos.md#52-primera-descomposición) |
| Bloques con bus de eventos | Bloques | [`bloques-eventos.puml`](bloques-eventos.puml) | [02 §2.1](../arquitectura/02-arquitectura.md#21-perspectiva-basada-en-eventos) |
| Componentes | Componentes | [`componentes.puml`](componentes.puml) | [02 §4](../arquitectura/02-arquitectura.md#4-diagrama-de-componentes) |
| Despliegue | Despliegue | [`despliegue.puml`](despliegue.puml) | [03 §2](../arquitectura/03-despliegue.md#2-diagrama-uml-de-despliegue) |
| Distribución | Despliegue (ubicación física) | [`distribucion.puml`](distribucion.puml) | [03 §2.2](../arquitectura/03-despliegue.md#22-diagrama-de-distribución) |

Los diagramas de capas, entidad-relación y secuencia están en Mermaid dentro de
[02-arquitectura.md](../arquitectura/02-arquitectura.md), que GitHub renderiza directamente.

## Regenerar los SVG

```bash
java -jar plantuml.jar -charset UTF-8 -tsvg docs/diagramas/*.puml
```

PlantUML se descarga de <https://plantuml.com/download> (requiere Java 11 o superior).
