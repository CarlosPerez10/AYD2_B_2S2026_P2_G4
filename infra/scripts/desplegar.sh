#!/usr/bin/env bash
# Despliegue completo en AWS: Terraform → imágenes en ECR → Ansible.
#
#   ./infra/scripts/desplegar.sh 1.0.0
#
# Variables opcionales:
#   LLAVE_SSH       Llave privada del operador (por defecto ~/.ssh/libreria-ayd).
#   AUTO_APROBAR=1  Aplica Terraform sin pedir confirmación.
#   ANSIBLE_VAULT_PASSWORD_FILE  Archivo con la contraseña de Vault (si no, se pregunta).
set -euo pipefail

VERSION="${1:?Uso: desplegar.sh <version>  (p. ej. 1.0.0)}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
DIR_TF="$RAIZ/infra/terraform"
DIR_ANSIBLE="$RAIZ/infra/ansible"
LLAVE_SSH="${LLAVE_SSH:-$HOME/.ssh/libreria-ayd}"

paso() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
falla() {
  printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2
  exit 1
}

# ---------- 0. Verificaciones previas ----------
paso "Verificando requisitos"
for herramienta in terraform aws docker ansible-playbook ansible-galaxy jq ssh; do
  command -v "$herramienta" > /dev/null || falla "Falta $herramienta. Ejecute infra/scripts/preparar-wsl.sh."
done
docker version > /dev/null 2>&1 || falla "Docker no responde. Active la integración de Docker Desktop con WSL."
aws sts get-caller-identity --query Arn --output text || falla "Credenciales de AWS inválidas o vencidas (aws configure / AWS Academy → AWS Details)."
[ -f "$DIR_TF/terraform.tfvars" ] || falla "Falta infra/terraform/terraform.tfvars (copie terraform.tfvars.example)."
[ -f "$DIR_ANSIBLE/group_vars/all/vault.yml" ] || falla "Falta infra/ansible/group_vars/all/vault.yml (copie vault.yml.example y cífrelo)."
[ -f "$LLAVE_SSH" ] || falla "No existe la llave $LLAVE_SSH (ssh-keygen -t ed25519 -f $LLAVE_SSH)."
[ -f "$LLAVE_SSH.pub" ] || falla "No existe $LLAVE_SSH.pub."
case "$(stat -c %a "$LLAVE_SSH")" in
  600 | 400) ;;
  *) falla "La llave $LLAVE_SSH debe tener permisos 600: chmod 600 $LLAVE_SSH (si está en /mnt/c, cópiela a ~/.ssh)." ;;
esac

# ---------- 1. Infraestructura ----------
paso "1/4 Terraform: red, VMs con IP elástica, ALB, RDS y ECR"
terraform -chdir="$DIR_TF" init -input=false
if [ "${AUTO_APROBAR:-0}" = "1" ]; then
  terraform -chdir="$DIR_TF" apply -input=false -auto-approve
else
  terraform -chdir="$DIR_TF" apply -input=false
fi

# ---------- 2. Imágenes ----------
paso "2/4 Construyendo y publicando imágenes $VERSION en ECR"
"$RAIZ/infra/scripts/build-push.sh" "$VERSION"

# ---------- 3. Inventario ----------
paso "3/4 Generando inventario de Ansible desde terraform output"
"$DIR_ANSIBLE/scripts/generar-inventario.sh" "$DIR_TF" "$LLAVE_SSH"

# ---------- 4. Configuración y despliegue ----------
paso "4/4 Ansible: sistema operativo, Docker y contenedores"
# En /mnt/c los directorios tienen permisos 777 y Ansible ignora un ansible.cfg ahí por
# seguridad; indicarlo explícitamente evita que se pierda la configuración del proyecto.
export ANSIBLE_CONFIG="$DIR_ANSIBLE/ansible.cfg"
cd "$DIR_ANSIBLE"
ansible-galaxy collection install -r requirements.yml

# La contraseña de Vault se pide una sola vez y se reutiliza en los dos comandos: el
# inventario carga group_vars/all/vault.yml incluso en comandos sueltos como el de espera.
if [ -z "${ANSIBLE_VAULT_PASSWORD_FILE:-}" ]; then
  read -r -s -p "Contraseña de Vault: " contrasena_vault
  echo
  archivo_vault="$(mktemp)"
  trap 'rm -f "$archivo_vault"' EXIT
  printf '%s' "$contrasena_vault" > "$archivo_vault"
  unset contrasena_vault
  export ANSIBLE_VAULT_PASSWORD_FILE="$archivo_vault"
fi

echo "Esperando a que las VMs acepten SSH…"
ansible all -m ansible.builtin.wait_for_connection -a "timeout=300"

ansible-playbook site.yml -e "version_imagen=$VERSION"

paso "Despliegue terminado"
dns="$(terraform -chdir="$DIR_TF" output -raw dns_alb)"
echo "Plataforma:      http://$dns"
echo "Salud:           http://$dns/health/servicios"
echo "IP elásticas:    $(terraform -chdir="$DIR_TF" output -json ips_elasticas | jq -c .)"
