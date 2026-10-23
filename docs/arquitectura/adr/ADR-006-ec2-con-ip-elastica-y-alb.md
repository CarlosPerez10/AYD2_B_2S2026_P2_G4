# ADR-006 · EC2 con IP elástica detrás de un ALB

- **Estado:** Aceptada
- **Fecha:** 2026-10-17

## Contexto

El enunciado pide IP públicas estáticas para las máquinas que alojan el frontend y los dos
microservicios, un balanceador de carga y despliegue con Ansible sobre el sistema operativo.
Esto descarta servicios sin servidor (ECS Fargate, Lambda), donde no hay sistema operativo
que configurar.

## Decisión

- Tres instancias EC2 Ubuntu 24.04 (`t3.micro`): **frontend** (frontend + gateway), **libros** y **ventas**.
- Una **IP elástica** por instancia, reservada con Terraform, para el acceso SSH de Ansible y pruebas directas.
- Un **Application Load Balancer** público con reglas: `/api/*` y `/health*` → gateway (puerto 8080); resto → frontend (puerto 80).
- Grupos de seguridad: el ALB acepta 80 desde Internet; frontend acepta 80/8080 solo desde el ALB; libros acepta 3001 desde frontend y ventas; ventas acepta 3002 desde frontend; SSH solo desde la IP del operador.
- Imágenes en **Amazon ECR**; cada instancia tiene un rol IAM de solo lectura sobre ECR.

## Consecuencias

- Se cumple el requisito de IP estáticas y se mantiene un único punto de entrada público (el ALB).
- El ALB queda listo para registrar más instancias del frontend/gateway si se escala horizontalmente.
- Las instancias tienen IP pública, por lo que el endurecimiento con grupos de seguridad y UFW es obligatorio.
