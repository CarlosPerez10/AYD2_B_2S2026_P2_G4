# Guía de despliegue en AWS

Responsable: **Billy James Asael Chamale Sánchez** (201907502)

Esta guía lleva la plataforma desde una cuenta de AWS vacía hasta el sistema accesible por
el DNS del balanceador, y explica cómo destruirlo todo.

## 1. Requisitos en el equipo del operador

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| Terraform | ≥ 1.6 | Crear la infraestructura. |
| AWS CLI | v2 | Credenciales y login en ECR. |
| Docker | ≥ 24 con Buildx | Construir las imágenes. |
| Ansible (`ansible-core`) | ≥ 2.15 | Configurar las VMs y desplegar. |
| `jq` | cualquiera | Generar el inventario. |

```bash
# Credenciales de AWS (en AWS Academy: copiar las de "AWS Details" a ~/.aws/credentials)
aws sts get-caller-identity

# Llave SSH del proyecto
ssh-keygen -t ed25519 -f ~/.ssh/libreria-ayd -C "libreria-ayd"
```

## 2. Infraestructura con Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Complete `terraform.tfvars`:

- `ip_operador`: su IP pública con `/32` (`curl -s https://checkip.amazonaws.com`).
- `llave_publica`: contenido de `~/.ssh/libreria-ayd.pub`.
- `contrasena_bd_libros` y `contrasena_bd_ventas`: mínimo 8 caracteres, sin `/`, `@`, `"` ni espacios.
- En **AWS Academy** descomente `perfil_instancia = "LabInstanceProfile"` (no se pueden crear roles IAM).

```bash
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan        # ≈ 10 min, la mayor parte es RDS
terraform output
```

Salidas: `ips_elasticas`, `ips_privadas`, `dns_alb`, `endpoints_rds`, `registro_ecr` y `urls_ecr`.

## 3. Imágenes en ECR

Desde la raíz del repositorio:

```bash
./infra/scripts/build-push.sh 1.0.0
```

El script inicia sesión en ECR, construye `frontend`, `api-gateway`, `libros` y `ventas`
para `linux/amd64`, y publica las etiquetas `1.0.0` y `latest`.
Alternativa: crear el tag `v1.0.0` en GitHub y dejar que lo haga el workflow
`build-push-ecr` (requiere los secretos de AWS en el repositorio).

## 4. Configuración y despliegue con Ansible

```bash
cd infra/ansible
ansible-galaxy collection install -r requirements.yml

# Inventario a partir de terraform output
./scripts/generar-inventario.sh

# Secretos: la llave de administración y las mismas contraseñas de terraform.tfvars
cp group_vars/all/vault.yml.example group_vars/all/vault.yml
$EDITOR group_vars/all/vault.yml
ansible-vault encrypt group_vars/all/vault.yml

# Comprobar acceso SSH
ansible all -m ping

# Desplegar
ansible-playbook site.yml --ask-vault-pass -e version_imagen=1.0.0
```

El playbook:

1. Actualiza paquetes, fija la zona horaria `America/Guatemala`, crea el usuario
   `despliegue` y activa UFW en las tres VMs.
2. Instala Docker Engine y el plugin de Compose desde el repositorio oficial de Docker.
3. Configura `amazon-ecr-credential-helper`, que usa el rol de la instancia.
4. Despliega Libros, luego Ventas y luego el gateway y el frontend, esperando en cada paso a
   que `/health` responda `200`.
5. Consulta `http://<dns_alb>/health/servicios` hasta que todo esté sano.

Una segunda ejecución del mismo comando debe terminar con `changed=0` (idempotencia).

## 5. Verificación

```bash
ALB=$(terraform -chdir=infra/terraform output -raw dns_alb)
curl -s "http://$ALB/health/servicios" | jq
curl -s "http://$ALB/api/v1/libros?q=garcia" | jq '.data[].titulo'
curl -s "http://$ALB/api/v1/ventas/ranking" | jq '.data[0]'
```

Abra `http://<dns_alb>` en el navegador: debe verse el catálogo.

| Síntoma | Causa probable |
|---------|----------------|
| `502` o `503` en el ALB | El *target group* aún no marca la VM como sana: espere 30 s; revise `docker ps` en la VM de frontend. |
| `/health/servicios` con `libros: caido` | Grupo de seguridad o UFW de la VM de libros, o RDS aún creándose. |
| Libros o Ventas se reinician | Revise `docker logs libros`: contraseña de BD distinta a la de Terraform o RDS inaccesible. |
| `no basic auth credentials` al descargar | El perfil de instancia no tiene lectura de ECR o `registro_ecr` del inventario es incorrecto. |

## 6. Actualizar a una nueva versión

```bash
./infra/scripts/build-push.sh 1.0.1
cd infra/ansible && ansible-playbook site.yml --ask-vault-pass -e version_imagen=1.0.1
```

## 7. Destruir todo

```bash
cd infra/terraform
terraform destroy
```

`forzar_eliminacion = true` (por defecto) permite borrar los repositorios con imágenes y las
RDS sin snapshot final, así la cuenta queda limpia. Verifique en la consola que no queden
IP elásticas sin asociar (tienen costo).

## 8. Costos aproximados (us-east-1, bajo demanda)

> Valores de referencia; confirme en la [calculadora de AWS](https://calculator.aws/) antes
> de la entrega. Con la capa gratuita o AWS Academy el costo puede ser menor.

| Recurso | Cantidad | Costo por hora aprox. (USD) |
|---------|---------:|----------------------------:|
| EC2 `t3.micro` | 3 | 0.0104 c/u |
| RDS `db.t3.micro` PostgreSQL | 2 | 0.018 c/u |
| Application Load Balancer | 1 | 0.0225 + LCU |
| IP públicas IPv4 (EIP asociadas y del ALB) | 5 | 0.005 c/u |
| Almacenamiento EBS gp3 / RDS gp3 | 100 GB | ≈ 0.011 en total |

Total aproximado: **≈ 0.13 USD por hora (≈ 3 USD por día)**. Destruya la infraestructura al
terminar.

## 9. Notas de seguridad

- Docker publica los puertos con sus propias reglas de iptables, que se evalúan antes que
  UFW. La protección efectiva de los puertos 80, 8080, 3001 y 3002 la dan los grupos de
  seguridad; UFW protege el resto de puertos del sistema operativo.
- `vault.yml`, `terraform.tfvars`, `hosts.ini` y las llaves están en `.gitignore`: nunca se
  suben al repositorio, ni siquiera cifrados. Cada operador los crea desde sus plantillas
  (`*.example`) y guarda la contraseña de Vault fuera del repositorio.
