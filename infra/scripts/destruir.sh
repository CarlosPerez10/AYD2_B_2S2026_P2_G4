#!/usr/bin/env bash
# Elimina toda la infraestructura creada por Terraform (VMs, IP elásticas, ALB, RDS y ECR).
#
#   ./infra/scripts/destruir.sh
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
DIR_TF="$RAIZ/infra/terraform"

echo "Se eliminarán TODOS los recursos de la Librería AYD en AWS, incluidas las bases de datos."
read -r -p "Escriba 'destruir' para continuar: " confirmacion
[ "$confirmacion" = "destruir" ] || { echo "Cancelado."; exit 1; }

terraform -chdir="$DIR_TF" destroy
rm -f "$RAIZ/infra/ansible/inventory/hosts.ini"

echo "Infraestructura eliminada. Revise en la consola de EC2 que no queden IP elásticas sueltas."
