# Infraestructura

Responsable: **Billy James Asael Chamale Sánchez** (201907502)

| Carpeta | Contenido |
|---------|-----------|
| `terraform/` | VPC, subredes, grupos de seguridad, EC2 con IP elástica, ALB, RDS y ECR. |
| `ansible/` | Configuración del sistema operativo, instalación de Docker Engine y despliegue de contenedores. |
| `scripts/build-push.sh` | Construye las 4 imágenes y las publica en ECR (`<version>` y `latest`). |

Ver [`docs/arquitectura/03-despliegue.md`](../docs/arquitectura/03-despliegue.md) y la
[guía de despliegue](../docs/manuales/guia-despliegue.md).

## Terraform

```
terraform/
├── main.tf                  # proveedor hashicorp/aws ~> 5.0, default_tags y módulos
├── variables.tf
├── outputs.tf               # IP elásticas y privadas, DNS del ALB, endpoints RDS, ECR
├── terraform.tfvars.example
└── modules/
    ├── red/                 # VPC 10.0.0.0/16, 2 públicas, 2 privadas, IGW, rutas
    ├── seguridad/           # sg-alb, sg-frontend, sg-libros, sg-ventas, sg-rds-*
    ├── computo/             # Ubuntu 24.04 t3.micro ×3, par de llaves, rol IAM, 3 EIP
    ├── balanceador/         # ALB, tg-frontend (:80), tg-gateway (:8080), regla /api/* y /health*
    ├── base_datos/          # 2 × RDS PostgreSQL 16 db.t3.micro privadas y cifradas
    └── registro/            # ECR frontend, api-gateway, libros, ventas (últimas 10 imágenes)
```

Validación esperada antes del PR:

```bash
cd infra/terraform
terraform fmt -check -recursive
terraform init -backend=false && terraform validate
```

## Ansible

```
ansible/
├── ansible.cfg
├── requirements.yml          # community.docker, community.general, ansible.posix
├── site.yml                  # comun + docker + ecr_login → libros → ventas → frontend → verificación por el ALB
├── inventory/hosts.ini.example
├── scripts/generar-inventario.sh
├── group_vars/
│   ├── all/main.yml
│   ├── all/vault.yml.example # copiar a vault.yml y cifrar con ansible-vault
│   └── frontend.yml, libros.yml, ventas.yml   # puertos que abre UFW
└── roles/
    ├── comun/                # apt, zona horaria America/Guatemala, usuario de despliegue, UFW
    ├── docker/               # Docker Engine + compose plugin del repositorio oficial
    ├── ecr_login/            # amazon-ecr-credential-helper (rol de la instancia, sin llaves)
    ├── despliegue_libros/
    ├── despliegue_ventas/
    └── despliegue_frontend/  # red "libreria" con api-gateway y frontend
```

Validación esperada: `ansible-lint` sin errores y una segunda ejecución de
`ansible-playbook site.yml` con `changed=0`.
