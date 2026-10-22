# 03 · Arquitectura de despliegue

Este documento describe cómo se distribuyen los componentes en AWS y qué parte de la
infraestructura crea **Terraform** y qué parte configura **Ansible**.

## 1. Vista general

| Elemento | Recurso AWS | Creado por |
|----------|-------------|------------|
| Red | VPC `10.0.0.0/16`, 2 subredes públicas, 2 subredes privadas, Internet Gateway, tablas de rutas | Terraform |
| Cómputo | 3 instancias EC2 Ubuntu 24.04 `t3.micro`: `frontend`, `libros`, `ventas` | Terraform |
| IP estáticas | 3 IP elásticas, una por instancia | Terraform |
| Balanceo | Application Load Balancer público, 2 *target groups* y reglas por ruta | Terraform |
| Persistencia | 2 instancias RDS PostgreSQL 16 `db.t3.micro` en subredes privadas | Terraform |
| Imágenes | 4 repositorios ECR: `frontend`, `api-gateway`, `libros`, `ventas` | Terraform |
| Permisos | Rol IAM con lectura de ECR asociado a las instancias | Terraform |
| Sistema operativo | Paquetes base, zona horaria, firewall UFW, usuario de despliegue | Ansible |
| Runtime | Docker Engine y plugin Compose desde el repositorio oficial de Docker | Ansible |
| Contenedores | Descarga de imágenes desde ECR y ejecución con red, variables y política de reinicio | Ansible |

## 2. Diagrama UML de despliegue

La fuente UML estricta (nodos, entornos de ejecución y artefactos con estereotipos) está en
[`docs/diagramas/despliegue.puml`](../diagramas/despliegue.puml). La siguiente versión en
Mermaid se renderiza directamente en GitHub.

```mermaid
flowchart TB
    USR["«device»<br/>Navegador del usuario"]

    subgraph AWS["«cloud» AWS · us-east-1"]
        ECR[("«artifact repository»<br/>Amazon ECR<br/>frontend · api-gateway · libros · ventas")]

        subgraph VPC["«network» VPC 10.0.0.0/16"]
            ALB["«device» Application Load Balancer<br/>:80<br/>/api/* , /health* → tg-gateway<br/>/* → tg-frontend"]

            subgraph PUB["«subnet» Públicas 10.0.1.0/24 · 10.0.2.0/24"]
                subgraph EC2F["«device» EC2 frontend · Ubuntu 24.04 · IP elástica"]
                    subgraph DKF["«executionEnvironment» Docker Engine"]
                        FEA["«artifact»<br/>frontend:1.x<br/>Nginx :80"]
                        GWA["«artifact»<br/>api-gateway:1.x<br/>Node.js :8080"]
                    end
                end
                subgraph EC2L["«device» EC2 libros · Ubuntu 24.04 · IP elástica"]
                    subgraph DKL["«executionEnvironment» Docker Engine"]
                        LIA["«artifact»<br/>libros:1.x<br/>Node.js :3001"]
                    end
                end
                subgraph EC2V["«device» EC2 ventas · Ubuntu 24.04 · IP elástica"]
                    subgraph DKV["«executionEnvironment» Docker Engine"]
                        VEA["«artifact»<br/>ventas:1.x<br/>Node.js :3002"]
                    end
                end
            end

            subgraph PRIV["«subnet» Privadas 10.0.11.0/24 · 10.0.12.0/24"]
                RDSL[("«device» RDS PostgreSQL 16<br/>libros_db :5432")]
                RDSV[("«device» RDS PostgreSQL 16<br/>ventas_db :5432")]
            end
        end
    end

    subgraph OPS["«device» Equipo del operador"]
        TF["«executionEnvironment» Terraform"]
        AN["«executionEnvironment» Ansible"]
    end

    USR -- "HTTP :80" --> ALB
    ALB -- "HTTP :80" --> FEA
    ALB -- "HTTP :8080" --> GWA
    GWA -- "HTTP :3001 (IP privada)" --> LIA
    GWA -- "HTTP :3002 (IP privada)" --> VEA
    VEA -- "HTTP :3001 (IP privada)" --> LIA
    LIA -- "TCP :5432 (TLS)" --> RDSL
    VEA -- "TCP :5432 (TLS)" --> RDSV

    TF -. "«provisiona» API de AWS" .-> VPC
    TF -. "«provisiona»" .-> ECR
    AN -. "«configura y despliega» SSH :22 a IP elásticas" .-> EC2F
    AN -. "«configura y despliega»" .-> EC2L
    AN -. "«configura y despliega»" .-> EC2V
    EC2F -. "docker pull" .-> ECR
    EC2L -. "docker pull" .-> ECR
    EC2V -. "docker pull" .-> ECR
```

### 2.1 Elementos del diagrama

| Elemento UML | Estereotipo | Descripción |
|--------------|-------------|-------------|
| Navegador del usuario | `«device»` | Cliente o administrador que accede por HTTP al DNS del ALB. |
| Application Load Balancer | `«device»` | Único punto de entrada público. Distribuye por ruta a dos *target groups*. |
| EC2 frontend / libros / ventas | `«device»` | Máquinas virtuales con IP elástica. |
| Docker Engine | `«executionEnvironment»` | Entorno donde corren los contenedores, instalado por Ansible. |
| `frontend`, `api-gateway`, `libros`, `ventas` | `«artifact»` | Imágenes Docker versionadas, descargadas de ECR. |
| RDS `libros_db` / `ventas_db` | `«device»` | Bases gestionadas, sin acceso público. |
| Amazon ECR | `«artifact repository»` | Registro privado de imágenes. |
| Terraform / Ansible | `«executionEnvironment»` | Herramientas que corren en el equipo del operador. |
