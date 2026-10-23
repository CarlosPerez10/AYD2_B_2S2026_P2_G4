# ADR-004 · Comunicación síncrona REST con compensación

- **Estado:** Aceptada
- **Fecha:** 2026-10-16

## Contexto

Registrar una venta toca dos servicios: Ventas guarda la transacción y Libros descuenta
existencias. Sin una base común no se puede usar una transacción ACID que cubra ambos pasos.
Se evaluó un bus de eventos (publicación/suscripción), pero agrega infraestructura (SQS/SNS o
RabbitMQ) y consistencia eventual en un flujo donde el administrador necesita saber al
instante si la venta se aceptó.

## Decisión

Usar REST síncrono de Ventas hacia Libros, con una **saga orquestada** por Ventas:

1. Consultar el libro (precio y datos vigentes).
2. Descontar existencias de forma atómica en Libros (`UPDATE ... WHERE existencias >= :cantidad`).
3. Guardar la venta.
4. Si el paso 3 falla, **compensar** reponiendo las existencias.

Las llamadas tienen tiempo límite de 3 s; si Libros no responde, la venta se rechaza con `503`.

## Consecuencias

- El administrador recibe una respuesta definitiva en la misma petición.
- Ventas depende de la disponibilidad de Libros para registrar, pero **no** para consultar el ranking.
- Si se agregan más consumidores de "venta registrada" (notificaciones, reportes), la evolución es publicar un evento a un bus sin cambiar el contrato actual.
