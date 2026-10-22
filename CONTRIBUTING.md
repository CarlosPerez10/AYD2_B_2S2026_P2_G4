# Guía de contribución

Este documento define cómo trabaja el Grupo 4 sobre el repositorio. Todos los integrantes
deben seguirlo para que el historial deje evidencia clara del trabajo de cada uno.

## 1. Flujo de ramas

Se usa un flujo basado en Git Flow simplificado:

```
main ──────────────●───────────────●──────────────● (releases etiquetados)
                    \             / \            /
develop ─────●───●───●───●───●───●───●───●───●──●
              \     /     \     /     \     /
feature/...    ●──●        ●──●        ●──●
```

| Rama | Propósito | Se crea desde | Se integra en |
|------|-----------|---------------|---------------|
| `main` | Código estable. Cada merge corresponde a un release etiquetado (`vX.Y.Z`). | — | — |
| `develop` | Rama de integración. Todo el trabajo llega aquí primero. | `main` | `main` (en release) |
| `feature/<descripcion>_<carnet>` | Nueva funcionalidad. | `develop` | `develop` |
| `fix/<descripcion>_<carnet>` | Corrección de errores. | `develop` | `develop` |
| `docs/<descripcion>_<carnet>` | Documentación. | `develop` | `develop` |
| `infra/<descripcion>_<carnet>` | Terraform, Ansible, contenedores. | `develop` | `develop` |
| `tests/<descripcion>_<carnet>` | Pruebas unitarias, de integración o de carga. | `develop` | `develop` |
| `chore/<descripcion>_<carnet>` | Configuración, dependencias, tareas de mantenimiento. | `develop` | `develop` |
| `release/vX.Y.Z` | Estabilización previa a un release. | `develop` | `main` y `develop` |
| `hotfix/<descripcion>_<carnet>` | Corrección urgente sobre producción. | `main` | `main` y `develop` |

Ejemplos:

- `feature/busqueda-libros_202307727`
- `tests/prueba_carga_202100147`
- `infra/terraform-red_201907502`

### Reglas

1. Nadie hace *push* directo a `main` ni a `develop`.
2. Todo cambio entra por Pull Request hacia `develop`, con al menos una revisión de otro integrante.
3. Los merges a `develop` usan `--no-ff` para conservar la historia de cada rama.
4. Antes de abrir el PR, la rama debe estar actualizada con `develop` y las pruebas deben pasar.
5. Las ramas se eliminan después de integrarse.

## 2. Formato de commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) en español:

```
<tipo>(<alcance opcional>): <descripción en imperativo, minúsculas, sin punto final>

[cuerpo opcional: qué y por qué]

[pie opcional: Refs #<issue>]
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `docs` | Solo documentación |
| `test` | Agregar o corregir pruebas |
| `refactor` | Cambio interno sin alterar comportamiento |
| `perf` | Mejora de rendimiento |
| `build` | Docker, dependencias, empaquetado |
| `ci` | Pipelines de integración continua |
| `infra` | Terraform y Ansible |
| `chore` | Mantenimiento general |

Alcances sugeridos: `gateway`, `libros`, `ventas`, `frontend`, `terraform`, `ansible`, `docs`.

Ejemplos:

```
feat(libros): agrega filtro por autor en el listado
fix(ventas): evita ranking duplicado cuando hay empates
infra(terraform): reserva IP elástica para la VM de frontend
```

Recuerden: **el merge de un Pull Request no cuenta como commit válido**. Cada integrante
debe tener commits propios y sustanciales en sus ramas.

## 3. Pull Requests

- Título con el mismo formato que los commits.
- Usar la plantilla `.github/pull_request_template.md`.
- Enlazar el issue correspondiente (`Closes #N`).
- Asignar a otro integrante como revisor.

## 4. Versionado

Se usa [SemVer](https://semver.org/lang/es/). Cada release se etiqueta en `main` como
`vMAJOR.MINOR.PATCH` y se documenta en `CHANGELOG.md`.
