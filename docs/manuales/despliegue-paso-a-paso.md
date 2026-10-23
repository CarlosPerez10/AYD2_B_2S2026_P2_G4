# Despliegue paso a paso (Windows + WSL)

Lista de verificación para desplegar la versión **1.0.0** desde un equipo con Windows.
Todo se ejecuta en la terminal de **Ubuntu (WSL)**. La [guía de despliegue](guia-despliegue.md)
explica cada herramienta en detalle; aquí está el camino corto.

Tiempo estimado: 30 a 40 minutos, la mayor parte esperando a que se creen las RDS.

---

## 1. Preparar el equipo (una sola vez)

**1.1** Docker Desktop: *Settings → Resources → WSL Integration →* activar **Ubuntu**.

**1.2** Abrir **Ubuntu** desde el menú Inicio e ir al repositorio:

```bash
cd /mnt/c/Users/DELL/OneDrive/Escritorio/AYD2/AYD2_B_2S2026_P2_G4
git switch main && git pull
```

**1.3** Instalar Terraform, AWS CLI, Ansible y jq:

```bash
./infra/scripts/preparar-wsl.sh
source ~/.bashrc
```

**1.4** Crear la llave SSH **dentro de WSL** (en `/mnt/c` los permisos no se pueden restringir
y SSH rechaza la llave):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/libreria-ayd -C "libreria-ayd" -N ""
chmod 600 ~/.ssh/libreria-ayd
```

## 2. Credenciales de AWS

### Opción A: AWS Academy (Learner Lab)

1. *Start Lab* y esperar a que el indicador esté en verde.
2. *AWS Details → AWS CLI: Show* y copiar el bloque completo.
3. Pegarlo en WSL:

```bash
mkdir -p ~/.aws
nano ~/.aws/credentials      # pegar el bloque [default] con aws_session_token
printf '[default]\nregion = us-east-1\n' > ~/.aws/config
aws sts get-caller-identity
```

> Las credenciales del laboratorio vencen al terminar la sesión: si un comando responde
> `ExpiredToken`, repita este paso.

### Opción B: cuenta propia

```bash
aws configure    # access key, secret, región us-east-1
aws sts get-caller-identity
```

## 3. Configurar Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
curl -s https://checkip.amazonaws.com       # su IP pública
cat ~/.ssh/libreria-ayd.pub                 # su llave pública
nano terraform.tfvars
```

| Variable | Valor |
|----------|-------|
| `ip_operador` | La IP anterior con `/32`, por ejemplo `190.56.10.20/32`. |
| `llave_publica` | El contenido completo de `~/.ssh/libreria-ayd.pub`. |
| `contrasena_bd_libros` / `contrasena_bd_ventas` | Dos contraseñas de 8 o más caracteres, sin `/`, `@`, `"` ni espacios. |
| `perfil_instancia` | **AWS Academy:** descomentar `perfil_instancia = "LabInstanceProfile"`. Cuenta propia: dejar comentado. |

```bash
cd ../..
```

## 4. Configurar los secretos de Ansible

```bash
cd infra/ansible
cp group_vars/all/vault.yml.example group_vars/all/vault.yml
nano group_vars/all/vault.yml     # llave de administración (16+ caracteres) y las MISMAS contraseñas de terraform.tfvars
ansible-vault encrypt group_vars/all/vault.yml
cd ../..
```

Anote la contraseña de Vault y la llave de administración: se usan al desplegar y para
entrar a *Administración* en la web.

## 5. Desplegar

```bash
./infra/scripts/desplegar.sh 1.0.0
```

El script:

1. Verifica herramientas, credenciales, `terraform.tfvars`, `vault.yml` y la llave SSH.
2. Ejecuta `terraform apply` (escriba `yes` cuando lo pida).
3. Construye las cuatro imágenes y las publica en ECR con la etiqueta `1.0.0`.
4. Genera el inventario de Ansible a partir de `terraform output`.
5. Espera a que las VMs acepten SSH y ejecuta el playbook (pide la contraseña de Vault).
6. Muestra la URL pública.

## 6. Verificar

```bash
ALB=$(terraform -chdir=infra/terraform output -raw dns_alb)
curl -s "http://$ALB/health/servicios" | jq
curl -s "http://$ALB/api/v1/libros?q=garcia" | jq '.data[].titulo'
curl -s "http://$ALB/api/v1/ventas/ranking?limite=3" | jq '.data'
```

**URL para compartir (HTTPS, funciona en celulares):**

```bash
terraform -chdir=infra/terraform output -raw url_https
```

Los navegadores de celular intentan `https://` primero y el ALB solo escucha en el puerto 80;
por eso, para abrir la plataforma desde un teléfono use la URL de CloudFront. CloudFront tarda
unos 5 a 10 minutos en crearse la primera vez.

Abrir `http://<dns_alb>` en el navegador y recorrer el [manual de usuario](manual-usuario.md).

Si algo falla, la tabla de síntomas está en la [guía de despliegue §5](guia-despliegue.md#5-verificación).

## 7. Evidencias para la calificación

Guardar en `docs/evidencias/` (capturas o texto):

- [ ] Salida de `terraform output` (IP elásticas, DNS del ALB, endpoints RDS).
- [ ] Consola de AWS: las 3 instancias EC2 con su IP elástica.
- [ ] Consola de AWS: el ALB con sus dos *target groups* sanos.
- [ ] Consola de AWS: las 2 instancias RDS (sin acceso público).
- [ ] Consola de AWS: los 4 repositorios ECR con la imagen `1.0.0`.
- [ ] Resumen final de `ansible-playbook` (`failed=0`).
- [ ] Segunda ejecución del playbook con `changed=0` (idempotencia).
- [ ] La plataforma abierta en el navegador por el DNS del ALB.
- [ ] Prueba de carga contra AWS (fila de AWS en [`tests/carga/README.md`](../../tests/carga/README.md)):

```bash
docker run --rm -i -e BASE_URL="http://$ALB" grafana/k6:0.54.0 run - < tests/carga/busqueda-y-ranking.js
```

Con 50 usuarios desde un solo equipo se supera el límite normal del gateway (300 peticiones
por minuto e IP) y aparecen respuestas `429`. Suba el límite solo durante la prueba y
restáurelo al terminar:

```bash
cd infra/ansible && export ANSIBLE_CONFIG=$PWD/ansible.cfg
ansible-playbook site.yml -l frontend,localhost --ask-vault-pass -e version_imagen=1.0.0 -e limite_peticiones_gateway=100000
# … prueba de carga …
ansible-playbook site.yml -l frontend,localhost --ask-vault-pass -e version_imagen=1.0.0
cd ../..
```

## 8. Al terminar: destruir

```bash
./infra/scripts/destruir.sh
```

Una infraestructura encendida cuesta cerca de 3 USD diarios (ver la guía §8). En AWS Academy,
*End Lab* detiene las instancias pero **no** borra RDS ni el ALB: destruya con Terraform.
