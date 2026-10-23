#!/usr/bin/env bash
# Arma inventory/hosts.ini a partir de las salidas de Terraform.
#
#   ./scripts/generar-inventario.sh [ruta-a-infra/terraform] [llave-ssh-privada]
set -euo pipefail

DIR_ANSIBLE="$(cd "$(dirname "$0")/.." && pwd)"
DIR_TERRAFORM="${1:-$DIR_ANSIBLE/../terraform}"
LLAVE_SSH="${2:-~/.ssh/libreria-ayd}"
DESTINO="$DIR_ANSIBLE/inventory/hosts.ini"

command -v jq > /dev/null || { echo "Se necesita jq (sudo apt install jq)." >&2; exit 1; }

salidas="$(terraform -chdir="$DIR_TERRAFORM" output -json)"
leer() { jq -r "$1" <<< "$salidas"; }

host() {
  local nombre="$1"
  # El host lleva el sufijo -vm para no llamarse igual que su grupo (advertencia de Ansible).
  printf '[%s]\n%s-vm ansible_host=%s ip_privada=%s\n\n' "$nombre" "$nombre" \
    "$(leer ".ips_elasticas.value.$nombre")" "$(leer ".ips_privadas.value.$nombre")"
}

{
  echo "# Generado por scripts/generar-inventario.sh el $(date -u +%Y-%m-%dT%H:%M:%SZ). No editar."
  echo
  host frontend
  host libros
  host ventas
  echo "[all:vars]"
  echo "ansible_user=ubuntu"
  echo "ansible_ssh_private_key_file=$LLAVE_SSH"
  echo "aws_region=$(leer '.region.value')"
  echo "registro_ecr=$(leer '.registro_ecr.value')"
  echo "rds_libros_host=$(leer '.endpoints_rds.value.libros')"
  echo "rds_ventas_host=$(leer '.endpoints_rds.value.ventas')"
  echo "dns_alb=$(leer '.dns_alb.value')"
} > "$DESTINO"

echo "Inventario escrito en $DESTINO"
