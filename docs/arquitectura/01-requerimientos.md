# 01 · Requerimientos y drivers de arquitectura

## 1. Contexto del negocio

La Librería AYD necesita una plataforma web para que su personal administrativo gestione el
catálogo de libros y registre las ventas, y para que sus clientes consulten los títulos
disponibles y los más vendidos. Hoy esta información se lleva de forma manual, lo que hace
difícil saber qué títulos tienen existencias y cuáles se venden más.

### 1.1 Objetivo del sistema

Ofrecer un catálogo consultable en línea, con búsqueda por título o autor, y un ranking de
los libros más vendidos que se actualice a partir de las transacciones registradas.

### 1.2 Alcance

| Incluye | No incluye |
|---------|------------|
| Consulta del catálogo (título, autor, precio, existencias) | Pagos en línea o pasarela de pago |
| Búsqueda y filtrado por título o autor | Carrito de compras para clientes |
| Registro de ventas por personal administrativo | Facturación electrónica |
| Ranking de libros más vendidos | Gestión de usuarios y contraseñas |
| Administración del catálogo (crear, editar, eliminar) | Envíos o logística |

## 2. Stakeholders

| Stakeholder | Interés | Influencia |
|-------------|---------|------------|
| Gerencia de la librería | Saber qué títulos se venden más para decidir compras | Alta |
| Personal administrativo | Mantener el catálogo al día y registrar ventas rápido | Alta |
| Clientes | Encontrar libros disponibles y ver recomendaciones (más vendidos) | Media |
| Equipo de desarrollo (Grupo 4) | Construir y operar la plataforma | Alta |
| Auxiliar y catedrática del curso | Evaluar arquitectura, IaC y despliegue | Alta |

## 3. Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Cliente | Primario, humano | Persona que consulta el catálogo, busca libros y revisa el ranking. No se autentica. |
| Administrador | Primario, humano | Personal de la librería. Además de consultar, gestiona el catálogo y registra ventas. Se identifica con una llave de administración. |
| Operador de infraestructura | Secundario, humano | Integrante del equipo que aprovisiona y despliega la plataforma con Terraform y Ansible. |
| AWS | Secundario, sistema externo | Proveedor de nube que aloja máquinas virtuales, balanceador, bases de datos y registro de contenedores. |

El **Administrador** es una especialización del **Cliente**: puede hacer todo lo que hace un
cliente y además las tareas de gestión.

## 4. Casos de uso de alto nivel

### 4.1 Core del sistema

```mermaid
flowchart LR
    C([Cliente])
    A([Administrador])
    subgraph SIS[Librería AYD]
        CU1((Consultar<br/>catálogo))
        CU2((Gestionar<br/>catálogo))
        CU3((Gestionar<br/>ventas))
    end
    C --- CU1
    A --- CU1
    A --- CU2
    A --- CU3
    A -. «generaliza» .-> C
```

### 4.2 Primera descomposición

```mermaid
flowchart LR
    C([Cliente])
    A([Administrador])
    subgraph SIS[Librería AYD]
        CU01((CU-01 Listar<br/>libros))
        CU02((CU-02 Buscar y<br/>filtrar libros))
        CU03((CU-03 Ver detalle<br/>de libro))
        CU04((CU-04 Consultar<br/>ranking))
        CU05((CU-05 Registrar<br/>libro))
        CU06((CU-06 Actualizar<br/>libro))
        CU07((CU-07 Eliminar<br/>libro))
        CU08((CU-08 Registrar<br/>venta))
        CU09((CU-09 Consultar<br/>historial de ventas))
        CU10((Validar<br/>existencias))
    end
    C --- CU01
    C --- CU02
    C --- CU03
    C --- CU04
    A --- CU05
    A --- CU06
    A --- CU07
    A --- CU08
    A --- CU09
    CU02 -. «extend» .-> CU01
    CU08 -. «include» .-> CU10
```

| Código | Caso de uso | Actor | Microservicio |
|--------|-------------|-------|---------------|
| CU-01 | Listar libros | Cliente, Administrador | Libros |
| CU-02 | Buscar y filtrar libros | Cliente, Administrador | Libros |
| CU-03 | Ver detalle de libro | Cliente, Administrador | Libros |
| CU-04 | Consultar ranking de más vendidos | Cliente, Administrador | Ventas |
| CU-05 | Registrar libro | Administrador | Libros |
| CU-06 | Actualizar libro | Administrador | Libros |
| CU-07 | Eliminar libro | Administrador | Libros |
| CU-08 | Registrar venta | Administrador | Ventas (+ Libros) |
| CU-09 | Consultar historial de ventas | Administrador | Ventas |

## 5. Casos de uso expandidos (drivers funcionales)

### CU-01 · Listar libros

| Campo | Detalle |
|-------|---------|
| Actores | Cliente, Administrador |
| Propósito | Mostrar los libros del catálogo con título, autor, precio y existencias. |
| Precondición | El microservicio de Libros está disponible. |
| Postcondición | El usuario ve una página del catálogo. |
| Requisitos | RF-01, RF-02, RNF-02 |

**Flujo principal**

| Actor | Sistema |
|-------|---------|
| 1. Ingresa a la página de catálogo. | |
| | 2. La API Gateway enruta `GET /api/v1/libros` al microservicio de Libros. |
| | 3. Devuelve la primera página (20 libros por defecto) ordenada por título. |
| 4. Revisa el listado y cambia de página si lo necesita. | |
| | 5. Devuelve la página solicitada con el total de resultados. |

**Flujos alternos**

- 3a. No hay libros registrados: se muestra el mensaje "No hay libros en el catálogo".
- 2a. El microservicio no responde: la API Gateway responde `503` y el frontend muestra un aviso de servicio no disponible.

### CU-02 · Buscar y filtrar libros

| Campo | Detalle |
|-------|---------|
| Actores | Cliente, Administrador |
| Propósito | Localizar libros por título o autor. |
| Precondición | El usuario está en la vista de catálogo. |
| Postcondición | El listado muestra solo los libros que coinciden. |
| Requisitos | RF-03, RF-04, RF-05, RNF-02 |

**Flujo principal**

| Actor | Sistema |
|-------|---------|
| 1. Escribe un texto en el buscador. | |
| | 2. Espera 300 ms sin escritura y envía `GET /api/v1/libros?q=<texto>`. |
| | 3. Busca coincidencias parciales, sin distinguir mayúsculas ni tildes, en título **o** autor. |
| 4. Opcionalmente filtra por autor, rango de precio o solo con existencias. | |
| | 5. Combina los filtros (`autor`, `precioMin`, `precioMax`, `disponibles`) y devuelve el resultado. |

**Flujos alternos**

- 3a. Sin coincidencias: se muestra "No se encontraron libros para «texto»" con opción de limpiar filtros.
- 5a. Rango de precio inválido (`precioMin > precioMax`): responde `400` con el detalle del error.

### CU-04 · Consultar ranking de más vendidos

| Campo | Detalle |
|-------|---------|
| Actores | Cliente, Administrador |
| Propósito | Conocer los títulos con más unidades vendidas. |
| Precondición | El microservicio de Ventas está disponible. |
| Postcondición | Se muestra el top de libros ordenado por unidades vendidas. |
| Requisitos | RF-09, RF-10, RNF-02 |

**Flujo principal**

| Actor | Sistema |
|-------|---------|
| 1. Ingresa a la vista "Más vendidos". | |
| | 2. Envía `GET /api/v1/ventas/ranking?limite=10`. |
| | 3. Agrupa las ventas por libro, suma unidades e ingresos y ordena de mayor a menor. |
| | 4. Devuelve posición, título, autor, unidades vendidas y monto total. |
| 5. Opcionalmente filtra por rango de fechas. | |
| | 6. Recalcula el ranking solo con las ventas del periodo. |

**Flujos alternos**

- 3a. No hay ventas registradas: se devuelve una lista vacía y el frontend muestra "Aún no hay ventas registradas".
- 3b. Empate en unidades: se desempata por monto total y luego por título, para que el orden sea estable.

### CU-05 · Registrar libro

| Campo | Detalle |
|-------|---------|
| Actores | Administrador |
| Propósito | Agregar un título nuevo al catálogo. |
| Precondición | El administrador envía la llave de administración válida. |
| Postcondición | El libro queda disponible en el catálogo. |
| Requisitos | RF-06, RNF-04 |

**Flujo principal**

| Actor | Sistema |
|-------|---------|
| 1. Completa título, autor, ISBN, precio y existencias. | |
| | 2. La API Gateway valida la llave `X-Api-Key` y enruta `POST /api/v1/libros`. |
| | 3. Valida los datos: título y autor obligatorios, precio > 0, existencias ≥ 0, ISBN único. |
| | 4. Guarda el libro y responde `201` con el recurso creado. |

**Flujos alternos**

- 2a. Llave ausente o incorrecta: responde `401` sin llegar al microservicio.
- 3a. Datos inválidos: responde `400` con la lista de campos con error.
- 3b. ISBN duplicado: responde `409`.

### CU-08 · Registrar venta

| Campo | Detalle |
|-------|---------|
| Actores | Administrador |
| Propósito | Registrar la venta de un libro para que cuente en el ranking. |
| Precondición | El libro existe y el administrador envía la llave válida. |
| Postcondición | La venta queda guardada con fecha y las existencias del libro disminuyen. |
| Requisitos | RF-07, RF-08, RNF-04, RNF-05 |
| Incluye | Validar existencias |

**Flujo principal**

| Actor | Sistema |
|-------|---------|
| 1. Selecciona el libro e ingresa la cantidad. | |
| | 2. La API Gateway valida la llave y enruta `POST /api/v1/ventas`. |
| | 3. Ventas consulta el libro en el microservicio de Libros (precio y título vigentes). |
| | 4. Ventas solicita a Libros descontar la cantidad (**Validar existencias**). |
| | 5. Libros descuenta de forma atómica solo si hay existencias suficientes. |
| | 6. Ventas guarda la transacción con libro, cantidad, precio unitario, total y fecha. |
| | 7. Responde `201` con la venta registrada. |

**Flujos alternos**

- 3a. El libro no existe: responde `404`.
- 5a. Existencias insuficientes: responde `409` y no se guarda la venta.
- 6a. Falla al guardar la venta después de descontar: Ventas ejecuta la compensación (devuelve las existencias a Libros) y responde `500`.
- 3b. Libros no responde: responde `503` y no se guarda la venta.

## 6. Requisitos funcionales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-01 | Listar los libros con título, autor, precio y existencias. | Alta |
| RF-02 | Paginar y ordenar el listado (por título, autor o precio). | Media |
| RF-03 | Buscar libros por coincidencia parcial en título o autor. | Alta |
| RF-04 | Filtrar libros por autor, rango de precio y disponibilidad. | Alta |
| RF-05 | Consultar el detalle de un libro. | Media |
| RF-06 | Crear, actualizar y eliminar libros (solo administrador). | Alta |
| RF-07 | Registrar ventas con libro, cantidad y fecha (solo administrador). | Alta |
| RF-08 | Descontar existencias al registrar una venta y rechazarla si no alcanzan. | Alta |
| RF-09 | Calcular el ranking de libros más vendidos a partir del historial. | Alta |
| RF-10 | Filtrar el ranking por rango de fechas y limitar el número de resultados. | Media |
| RF-11 | Consultar el historial de ventas paginado (solo administrador). | Media |

## 7. Drivers de atributos de calidad

Cada atributo se expresa como un escenario: **estímulo → respuesta → medida**.

| ID | Atributo | Escenario | Medida | Táctica aplicada |
|----|----------|-----------|--------|------------------|
| RNF-01 | Disponibilidad | Un contenedor de un microservicio se detiene inesperadamente. | Docker lo reinicia en menos de 30 s; el ALB deja de enviarle tráfico mientras su *health check* falla. | Política `restart: unless-stopped`, *health checks* en ALB y en contenedores. |
| RNF-02 | Rendimiento | Un cliente busca un libro con 50 usuarios concurrentes. | El percentil 95 de respuesta es menor a 500 ms. | Índices de búsqueda en PostgreSQL, paginación obligatoria, compresión gzip en gateway. |
| RNF-03 | Escalabilidad | Aumenta el tráfico en el catálogo. | Se puede agregar otra instancia de Libros detrás del gateway sin cambiar código, y escalar RDS verticalmente. | Servicios sin estado, configuración por variables de entorno, base de datos gestionada. |
| RNF-04 | Seguridad | Un usuario sin llave intenta crear un libro o una venta. | La API Gateway responde `401` y la petición nunca llega al microservicio. | Autenticación en el borde, grupos de seguridad que solo permiten tráfico interno a los microservicios, bases de datos en subred privada. |
| RNF-05 | Consistencia | Dos ventas simultáneas compiten por la última unidad de un libro. | Solo una se registra; la otra recibe `409`. | Descuento atómico (`UPDATE ... WHERE existencias >= cantidad`) y compensación ante fallos. |
| RNF-06 | Mantenibilidad | Se necesita cambiar la base de datos de un servicio. | El cambio se limita a la capa de acceso a datos de ese servicio. | Arquitectura por capas, base de datos por servicio, contratos OpenAPI. |
| RNF-07 | Portabilidad / reproducibilidad | Se necesita recrear el entorno desde cero. | `terraform apply` + `ansible-playbook` levantan todo sin pasos manuales en menos de 30 min. | Infraestructura como código, imágenes Docker versionadas en ECR. |
| RNF-08 | Observabilidad | Un error ocurre en una petición que pasa por varios servicios. | Se puede rastrear con un único identificador en los logs de todos los servicios. | Encabezado `X-Request-Id` propagado por el gateway, logs estructurados en JSON. |

## 8. Drivers de restricción

| ID | Restricción | Origen |
|----|-------------|--------|
| RES-01 | Patrón de microservicios sobre arquitectura por capas, con dos servicios: Libros y Ventas. | Enunciado |
| RES-02 | API Gateway como punto de entrada único. | Enunciado |
| RES-03 | Infraestructura definida con Terraform: red, máquinas virtuales, IP públicas estáticas, balanceador y bases de datos gestionadas. | Enunciado |
| RES-04 | Configuración de sistema operativo, instalación de Docker Engine y despliegue con Ansible. | Enunciado |
| RES-05 | Todos los componentes en contenedores Docker publicados en un registro en la nube. | Enunciado |
| RES-06 | Nube pública: AWS. | Decisión del equipo |
| RES-07 | Una base de datos independiente por microservicio. | Enunciado / patrón |
| RES-08 | Documentación en Markdown dentro del repositorio. | Enunciado |
| RES-09 | Fecha de entrega: 22 de octubre de 2026. | Cronograma |
