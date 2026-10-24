# 01 · Requerimientos y drivers de arquitectura

## 1. Contexto del negocio

La Librería AYD necesita una plataforma web para que su personal administrativo gestione el
catálogo de libros y registre las ventas, y para que sus clientes consulten los títulos
disponibles y los más vendidos. Hoy esta información se lleva de forma manual, lo que hace
difícil saber qué títulos tienen existencias y cuáles se venden más.

![Diagrama de contexto — Sistema Librería AYD](../diagramas/diagrama-contexto.png)

### 1.1 Objetivos de negocio y del sistema

Ofrecer un catálogo consultable en línea, con búsqueda por título o autor, y un ranking de
los libros más vendidos que se actualice a partir de las transacciones registradas.

| ID | Objetivo de negocio | Criterio de éxito |
|----|---------------------|-------------------|
| ON-1 | Digitalizar la consulta de catálogo y disponibilidad de ejemplares para clientes y personal. | Catálogo paginado con búsqueda tolerante a mayúsculas y tildes (`p95 < 500 ms`). |
| ON-2 | Garantizar el control exacto de existencias y el cálculo en línea de los libros más vendidos. | Descuento atómico sin sobreventa y ranking top por unidades y monto. |
| ON-3 | Estandarizar el aprovisionamiento y despliegue de los microservicios en la nube pública (AWS). | Recreación automatizada con Terraform y Ansible sobre contenedores en ECR. |

### 1.2 Alcance

| Incluye | No incluye |
|---------|------------|
| Consulta del catálogo (título, autor, precio, existencias) | Pagos en línea o pasarela de pago |
| Búsqueda y filtrado por título o autor | Carrito de compras para clientes |
| Registro de ventas por personal administrativo | Facturación electrónica |
| Ranking de libros más vendidos | Gestión de usuarios y contraseñas |
| Administración del catálogo (crear, editar, eliminar) | Envíos o logística |

#### Plan de entregas por iteración

| Entrega | ID de características a incluir | Descripción |
|---------|---------------------------------|-------------|
| **1.0 (Práctica 2)** | CAR-01, CAR-02, CAR-03, CAR-04, CAR-05, CAR-06, CAR-07, CAR-08 | Catálogo en línea, búsqueda y filtros, ranking de más vendidos, administración de catálogo, registro transaccional de ventas, microservicios con API Gateway e IaC completa (Terraform + Ansible + Docker + AWS). |
| **2.0 (Futura)** | CAR-09, CAR-10 | Integración asíncrona mediante bus de eventos (SNS + SQS) y vista materializada de ranking. |
| **3.0 (Futura)** | CAR-11 | Alertas automáticas de agotamiento de inventario a gerencia y reportes exportables. |

### 1.3 Características del sistema

| ID | Característica | Descripción | Prioridad | Objetivo de negocio asociado |
|----|----------------|-------------|-----------|------------------------------|
| CAR-01 | Catálogo en línea | Listado paginado con título, autor, precio y existencias. | Alta | ON-1 |
| CAR-02 | Búsqueda y filtrado | Búsqueda por título o autor sin distinguir mayúsculas ni tildes; filtros por autor, precio y disponibilidad. | Alta | ON-1 |
| CAR-03 | Ranking de más vendidos | Calculado a partir del historial de ventas, filtrable por período. | Alta | ON-2 |
| CAR-04 | Administración del catálogo | Alta, edición y baja de libros protegidas por llave de administración. | Alta | ON-1, ON-2 |
| CAR-05 | Registro de ventas | Cada venta descuenta existencias de forma atómica y queda en el historial. | Alta | ON-2 |
| CAR-06 | Arquitectura de microservicios | Libros y Ventas independientes detrás de una API Gateway, cada uno con su base de datos. | Alta | ON-2, ON-3 |
| CAR-07 | Infraestructura como código | Toda la nube se crea con Terraform y se configura con Ansible, de forma reproducible. | Alta | ON-3 |
| CAR-08 | Contenedores | Todos los componentes se distribuyen como imágenes Docker en un registro privado. | Alta | ON-3 |

## 2. Stakeholders

| Nombre | Descripción | Responsabilidades |
|--------|-------------|-------------------|
| Gerencia de la librería | Dirección comercial de Librería AYD interesada en la rotación de inventario y ventas. | Analizar el ranking de libros más vendidos para decidir compras y reabastecimiento con proveedores. |
| Personal administrativo | Vendedores y encargados de inventario que operan la librería en el día a día. | Mantener el catálogo actualizado (alta, edición, baja) y registrar cada venta realizada. |
| Clientes | Lectores y compradores que visitan la plataforma web sin necesidad de registro. | Consultar el catálogo disponible, buscar por título o autor y revisar el ranking de más vendidos. |
| Equipo de desarrollo y operaciones (Grupo 4) | Arquitecto, desarrolladores de microservicios/frontend e ingeniero DevOps del proyecto. | Diseñar la arquitectura, implementar los servicios, aprovisionar AWS con Terraform y desplegar con Ansible. |
| Auxiliar y catedrática del curso | Cuerpo docente del Laboratorio de Análisis y Diseño de Sistemas 2. | Evaluar el cumplimiento funcional, arquitectónico, documental y el despliegue automatizado en la nube. |

## 3. Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| Cliente | Primario, humano | Persona que consulta el catálogo, busca libros y revisa el ranking. No se autentica. |
| Administrador | Primario, humano | Personal de la librería. Además de consultar, gestiona el catálogo y registra ventas. Se identifica con una llave de administración. |
| Operador de infraestructura | Secundario, humano | Integrante del equipo que aprovisiona y despliega la plataforma con Terraform y Ansible. |
| AWS | Secundario, sistema externo | Proveedor de nube que aloja máquinas virtuales, balanceador, bases de datos y registro de contenedores. |

El **Administrador** es una especialización del **Cliente**: puede hacer todo lo que hace un
cliente y además las tareas de gestión.

## 4. Modelo de casos de uso del negocio

Describe los procesos de la librería **independientemente del sistema**: qué hace el negocio
para dar valor a sus actores. Los casos de uso del sistema (sección 5) automatizan parte de
estos procesos.

![Modelo de casos de uso del negocio](../diagramas/cun-negocio.png)

| Actor del negocio | Rol |
|-------------------|-----|
| Cliente | Compra libros y quiere saber qué hay disponible y qué es popular. |
| Proveedor | Editorial o distribuidor que abastece los títulos. |
| Gerencia | Decide qué títulos reabastecer según las ventas. |

| Trabajador del negocio | Rol |
|------------------------|-----|
| Vendedor | Atiende al cliente y registra la venta. |
| Encargado de inventario | Mantiene el catálogo y las existencias. |

| Código | Caso de uso del negocio | Actor | Tipo | Automatizado por |
|--------|-------------------------|-------|------|------------------|
| CUN-01 | Vender libros | Cliente | Núcleo | CU-08, CU-09 |
| CUN-02 | Informar disponibilidad del catálogo | Cliente | Núcleo | CU-01, CU-02, CU-03 |
| CUN-03 | Abastecer catálogo | Proveedor | Soporte | CU-05, CU-06, CU-07 |
| CUN-04 | Analizar títulos más vendidos | Gerencia | Gerencial | CU-04 |

### 4.1 CUN-01 · Vender libros (expandido)

| Campo | Detalle |
|-------|---------|
| Nombre | Vender libros |
| Actores | Cliente (actor del negocio); Vendedor y Encargado de inventario (trabajadores) |
| Propósito | Entregar al cliente los libros que solicita y dejar constancia de la venta. |
| Resumen | Inicia cuando el cliente pide uno o más títulos. El vendedor confirma la disponibilidad, cobra y registra la venta; termina cuando el cliente recibe los libros y las existencias quedan actualizadas. |
| Prioridad | Alta |
| Mejoras | Hoy la disponibilidad se revisa a mano en estanterías y la venta se anota en papel; la plataforma lo hace en línea y alimenta el ranking. |

**Curso normal**

| Acción del actor | Respuesta del negocio |
|------------------|-----------------------|
| 1. El cliente solicita uno o más títulos. | |
| | 2. El vendedor busca el título en el catálogo. |
| | 3. El vendedor confirma que hay existencias suficientes. |
| | 4. El vendedor cobra y registra la venta con la fecha. |
| | 5. El encargado de inventario ve reflejada la baja de existencias. |
| 6. El cliente recibe los libros. | |

**Cursos alternos**

- 3a. No hay existencias suficientes: el vendedor ofrece la cantidad disponible o un título similar; si el cliente no acepta, no se registra la venta.
- 2a. El título no está en el catálogo: el vendedor lo anota como solicitud para CUN-03.

## 5. Casos de uso del sistema de alto nivel

### 5.1 Core del sistema

![CDU alto nivel — core del sistema](../diagramas/cdu-alto-nivel.png)

El **Administrador** especializa al **Cliente**: hereda la consulta del catálogo y agrega la
gestión del catálogo y de las ventas.

### 5.2 Primera descomposición

![CDU — primera descomposición](../diagramas/cdu-primera-descomposicion.png)

### 5.3 Diagrama de casos de uso expandidos (drivers funcionales)

![CDU expandidos — drivers funcionales](../diagramas/cdu-expandidos.png)

| ID | Caso de uso | Descripción | Característica asociada | Actor | Microservicio |
|----|-------------|-------------|-------------------------|-------|---------------|
| CU-01 | Listar libros | Consulta paginada del catálogo con título, autor, precio y existencias. | CAR-01 | Cliente, Administrador | Libros |
| CU-02 | Buscar y filtrar libros | Búsqueda parcial por título o autor (sin distinguir tildes ni mayúsculas) y filtros combinables. | CAR-02 | Cliente, Administrador | Libros |
| CU-03 | Ver detalle de libro | Visualización de ISBN, precio, existencias y fecha de actualización de un ejemplar. | CAR-01 | Cliente, Administrador | Libros |
| CU-04 | Consultar ranking de más vendidos | Cálculo del top de libros por unidades vendidas y monto total, filtrable por fechas. | CAR-03 | Cliente, Administrador | Ventas |
| CU-05 | Registrar libro | Alta de un nuevo título en el catálogo validando ISBN único y llave de administración. | CAR-04 | Administrador | Libros |
| CU-06 | Actualizar libro | Modificación de datos y existencias de un libro existente en el catálogo. | CAR-04 | Administrador | Libros |
| CU-07 | Eliminar libro | Baja de un libro del catálogo protegida por llave de administración. | CAR-04 | Administrador | Libros |
| CU-08 | Registrar venta | Registro transaccional de una venta con descuento atómico de existencias y compensación ante fallos. | CAR-05 | Administrador | Ventas (+ Libros) |
| CU-09 | Consultar historial de ventas | Consulta paginada de las transacciones registradas en orden cronológico inverso. | CAR-05 | Administrador | Ventas |

## 6. Casos de uso del sistema expandidos (drivers funcionales)

### CU-01 · Listar libros

| Campo | Detalle |
|-------|---------|
| Actores | Cliente, Administrador |
| Propósito | Mostrar los libros del catálogo con título, autor, precio y existencias. |
| Resumen | Inicia cuando el usuario entra al catálogo y termina cuando ve la página de libros solicitada, ordenada y con el total de resultados. |
| Prioridad | Alta |
| Mejoras | Reemplaza la consulta manual en estanterías; la información de existencias está siempre al día. |
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
| Resumen | Inicia cuando el usuario escribe o elige un filtro y termina cuando el listado muestra solo los libros que coinciden con todos los criterios. |
| Prioridad | Alta |
| Mejoras | Búsqueda tolerante a tildes y mayúsculas; los filtros quedan en la URL para compartir la búsqueda. |
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
| Resumen | Inicia cuando el usuario abre «Más vendidos» y termina cuando ve el top de libros del período elegido. |
| Prioridad | Alta |
| Mejoras | La gerencia deja de calcular el ranking a mano; los clientes reciben recomendaciones basadas en ventas reales. |
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
| Resumen | Inicia cuando el administrador abre el formulario de nuevo libro y termina cuando el libro queda visible en el catálogo. |
| Prioridad | Alta |
| Mejoras | Validación inmediata de datos e ISBN único; el catálogo se actualiza para todos al instante. |
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
| Resumen | Inicia cuando el administrador elige un libro y una cantidad, y termina cuando la venta queda registrada y las existencias disminuyen, o se rechaza sin cambiar nada. |
| Prioridad | Alta |
| Mejoras | El descuento atómico evita vender unidades inexistentes, incluso con ventas simultáneas; cada venta alimenta el ranking. |
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

## 7. Requisitos funcionales

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

## 8. Drivers de atributos de calidad

Cada atributo de calidad se modela mediante escenarios formales de 6 partes (**fuente de estímulo → estímulo → artefacto → entorno → respuesta → medida de la respuesta**) y se prioriza con una tupla **(importancia para el stakeholder, dificultad técnica de implementación)** usando la escala **A** (Alta), **M** (Media) y **B** (Baja).

| ID | Atributo | Fuente de estímulo | Estímulo | Artefacto | Entorno | Respuesta | Medida de la respuesta | Prioridad | Táctica aplicada |
|----|----------|--------------------|----------|-----------|---------|-----------|------------------------|:---------:|------------------|
| RNF-01 | Disponibilidad | Contenedor o proceso Node.js | Un contenedor de un microservicio se detiene inesperadamente. | Contenedor Docker / ALB | Operación normal en AWS | Docker reinicia el contenedor automáticamente y el ALB deja de enviarle tráfico mientras falla `/health`. | Recuperación del contenedor en `< 30 s`; disponibilidad general `≥ 99 %`. | (A, M) | Política `restart: unless-stopped`, *health checks* en ALB y en contenedores. |
| RNF-02 | Rendimiento (Latencia) | Clientes concurrentes | Búsqueda de libros por título/autor o consulta del ranking de más vendidos. | API Gateway, Libros, Ventas y RDS | Carga normal (50 usuarios concurrentes) | Los servicios procesan la consulta paginada usando índices GIN (`pg_trgm`) y de fecha en PostgreSQL. | Percentil 95 (`p95`) de tiempo de respuesta `< 500 ms`. | (A, A) | Índices `pg_trgm` con `unaccent`, paginación obligatoria, compresión gzip en Nginx. |
| RNF-03 | Escalabilidad | Incremento de usuarios | Aumenta el tráfico de consultas al catálogo o registro de ventas. | Instancias EC2 y Amazon RDS | Pico de demanda | Se agregan instancias detrás del ALB/Gateway sin modificar código y se escala RDS verticalmente. | Cero cambios en código fuente (`0 líneas`) para escalar horizontal o verticalmente. | (M, M) | Servicios *stateless*, configuración por variables de entorno ([12-Factor](https://12factor.net/es/config)), RDS gestionado. |
| RNF-04 | Seguridad | Usuario externo no autorizado | Intento de crear/editar/eliminar libros (`POST/PUT/DELETE`) o acceder a `/internal/v1/*` o a RDS. | API Gateway, Security Groups y subredes privadas | Operación expuesta en Internet | La API Gateway rechaza peticiones sin `X-Api-Key` válida o dirigidas a `/internal/*`; AWS bloquea tráfico directo a RDS. | `100 %` de intentos no autorizados rechazados con `401`/`403` en `< 10 ms`; `0` puertos de BD públicos. | (A, A) | Autenticación en el borde, bloqueo de rutas internas, grupos de seguridad encadenados y RDS en subred privada. |
| RNF-05 | Consistencia / Integridad | Dos administradores simultáneos | Dos ventas concurrentes compiten por la última unidad disponible de un libro. | Microservicio de Ventas, Microservicio de Libros y `libros_db` | Operación concurrente | Libros ejecuta descuento atómico en SQL y Ventas aplica compensación si falla la escritura local. | `0` libros con existencias negativas (`CHECK >= 0`); exactamente una venta recibe `201` y la otra `409`. | (A, A) | `UPDATE ... WHERE existencias >= $2` y saga orquestada con compensación (`POST .../reponer`). |
| RNF-06 | Mantenibilidad | Equipo de desarrollo | Cambio en el esquema de persistencia o en una regla de negocio de un microservicio. | Capas `repositories` / `services` del microservicio | Desarrollo y mantenimiento | El cambio queda aislado dentro de la capa correspondiente de ese único microservicio sin afectar al otro. | Cambio confinado a `1` microservicio y `≤ 2` archivos de su capa interna; pruebas en verde. | (A, B) | Arquitectura por capas dentro de cada microservicio, base de datos por servicio y contratos OpenAPI 3.0. |
| RNF-07 | Portabilidad / Reproducibilidad | Operador de infraestructura | Recreación completa del entorno de nube desde cero en una cuenta o región limpia. | Módulos Terraform, playbooks Ansible e imágenes en ECR | Aprovisionamiento y despliegue | `terraform apply` crea toda la red, VMs, ALB, RDS y ECR; `ansible-playbook` instala Docker y despliega los contenedores. | Entorno completo operativo y verificado con `/health` en `< 30 min` con `0` pasos manuales en consola. | (A, A) | Infraestructura como código (Terraform) + gestión de configuración (Ansible) + contenedores Docker. |
| RNF-08 | Observabilidad | Operador / Desarrollador | Ocurre un error en una petición que atraviesa API Gateway, Ventas y Libros. | Logs de contenedores | Diagnóstico de fallos | El gateway propaga `X-Request-Id` a los microservicios y todos registran eventos estructurados en JSON. | `100 %` de las respuestas de error y líneas de log incluyen el mismo `requestId` correlacionado. | (M, B) | Middleware `requestId`, propagación de cabeceras HTTP y logs estructurados en JSON. |

## 9. Drivers de restricción

Las restricciones se clasifican según su origen en restricciones **del cliente / enunciado** y restricciones **de la organización de desarrollo (Grupo 4)**:

### 9.1 Restricciones del cliente (enunciado y curso)

| ID | Restricción | Detalle |
|----|-------------|---------|
| RES-01 | Estilo arquitectónico híbrido | Patrón de microservicios sobre arquitectura por capas, con al menos dos microservicios independientes: **Libros** y **Ventas**. |
| RES-02 | Punto de entrada único | Uso obligatorio de una **API Gateway** como punto de entrada para el frontend. |
| RES-03 | Aprovisionamiento con Terraform | Red (VPC y subredes), máquinas virtuales, IPs públicas estáticas, balanceador de carga y bases de datos gestionadas deben crearse con **Terraform**. |
| RES-04 | Configuración y despliegue con Ansible | Configuración de sistema operativo, instalación de Docker Engine y despliegue de contenedores deben automatizarse con **Ansible**. |
| RES-05 | Contenedorización completa | Todos los componentes (Frontend, API Gateway, Libros y Ventas) deben empaquetarse en contenedores **Docker** publicados en un registro en la nube. |
| RES-07 | Base de datos por microservicio | Cada microservicio debe contar con su propia base de datos gestionada independiente en la nube. |
| RES-08 | Documentación en el repositorio | Toda la documentación técnica, arquitectónica y manuales deben entregarse en formato Markdown dentro del repositorio oficial. |
| RES-09 | Plazo de entrega | Fecha límite de entrega y evaluación: **22 de octubre de 2026**. |

### 9.2 Restricciones de la organización de desarrollo (Grupo 4)

| ID | Restricción | Detalle |
|----|-------------|---------|
| RES-06 | Proveedor de nube pública | Selección de **Amazon Web Services (AWS)** en la región `us-east-1` (EC2, ALB, RDS PostgreSQL 16, ECR, CloudFront). |
| RES-10 | Homogeneidad tecnológica | Estandarización en **Node.js 22 LTS + Express** para API Gateway y microservicios, **React 18 + Vite** para el frontend y **PostgreSQL 16** para persistencia. |
| RES-11 | Presupuesto de capa gratuita / estudiantil | Uso de instancias `t3.micro` (EC2) y `db.t3.micro` (RDS) para acotar costos operativos durante el laboratorio. |

## 10. Matrices de trazabilidad

### 10.1 Stakeholders ↔ vistas y perspectivas de arquitectura

Notación según la guía de arquitectura: **`d`** = información detallada, **`m`** = información moderada / general, **`p`** = panorama (vista de alto nivel).

| Stakeholder \ Vista | Contexto y CUN | Casos de uso (CDU) | Vista lógica (Bloques y Capas) | Vista de componentes | Vista de datos (Persistencia) | Vista de despliegue y distribución |
|---------------------|:--------------:|:------------------:|:------------------------------:|:--------------------:|:-----------------------------:|:----------------------------------:|
| Gerencia de la librería | d | m | p | p | p | p |
| Personal administrativo | d | d | p | p | p | p |
| Clientes | m | d | p | p | p | p |
| Equipo de desarrollo y operaciones (Grupo 4) | d | d | d | d | d | d |
| Auxiliar y catedrática del curso | d | d | d | d | d | d |

### 10.2 Casos de uso ↔ requisitos funcionales

| CU \ RF | RF-01 | RF-02 | RF-03 | RF-04 | RF-05 | RF-06 | RF-07 | RF-08 | RF-09 | RF-10 | RF-11 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| CU-01 | ● | ● | | | | | | | | | |
| CU-02 | | | ● | ● | | | | | | | |
| CU-03 | | | | | ● | | | | | | |
| CU-04 | | | | | | | | | ● | ● | |
| CU-05 | | | | | | ● | | | | | |
| CU-06 | | | | | | ● | | | | | |
| CU-07 | | | | | | ● | | | | | |
| CU-08 | | | | | | | ● | ● | | | |
| CU-09 | | | | | | | | | | | ● |

### 10.3 Requisitos ↔ componentes

| Requisito | Frontend | API Gateway | Libros | Ventas | RDS | Terraform | Ansible |
|-----------|:--------:|:-----------:|:------:|:------:|:---:|:---------:|:-------:|
| RF-01 – RF-05 | ● | ● | ● | | ● | | |
| RF-06 | ● | ● | ● | | ● | | |
| RF-07, RF-08 | ● | ● | ● | ● | ● | | |
| RF-09 – RF-11 | ● | ● | | ● | ● | | |
| RNF-01 | | ● | ● | ● | | ● | ● |
| RNF-04 | | ● | | | ● | ● | |
| RNF-05 | | | ● | ● | ● | | |
| RNF-07 | | | | | | ● | ● |
| RNF-08 | | ● | ● | ● | | | |

### 10.4 Casos de uso del negocio ↔ casos de uso del sistema

| CUN \ CU | CU-01 | CU-02 | CU-03 | CU-04 | CU-05 | CU-06 | CU-07 | CU-08 | CU-09 |
|----------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| CUN-01 Vender libros | | | | | | | | ● | ● |
| CUN-02 Informar disponibilidad | ● | ● | ● | | | | | | |
| CUN-03 Abastecer catálogo | | | | | ● | ● | ● | | |
| CUN-04 Analizar más vendidos | | | | ● | | | | | |

### 10.5 Componentes ↔ responsables

| Componente | Responsable | Carnet |
|------------|-------------|--------|
| Arquitectura, contratos, API Gateway, integración | Carlos Javier Pérez Pocón | 202206425 |
| Microservicio de Libros | Luis Fernando González | 202307727 |
| Microservicio de Ventas | Eduardo Misael López Ávila | 202100147 |
| Frontend y manual de usuario | Kevin Mark Hernández Chicol | 202001053 |
| Terraform, Ansible, ECR, despliegue | Billy James Asael Chamale Sánchez | 201907502 |
