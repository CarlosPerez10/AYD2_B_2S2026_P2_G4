#!/usr/bin/env bash
# Instala en Ubuntu (WSL o nativo) las herramientas del operador: Terraform, AWS CLI v2,
# Ansible y jq. Es idempotente: si una herramienta ya está, la deja como está.
# k6 no se instala: se ejecuta con Docker (ver tests/carga/README.md).
#
#   ./infra/scripts/preparar-wsl.sh
set -euo pipefail

paso() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
existe() { command -v "$1" > /dev/null 2>&1; }

paso "Paquetes base"
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl gnupg unzip jq lsb-release pipx > /dev/null

if ! existe terraform; then
  paso "Terraform (repositorio oficial de HashiCorp)"
  curl -fsSL https://apt.releases.hashicorp.com/gpg \
    | sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
    | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq terraform > /dev/null
fi

if ! existe aws; then
  paso "AWS CLI v2"
  temporal="$(mktemp -d)"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "$temporal/awscliv2.zip"
  unzip -q "$temporal/awscliv2.zip" -d "$temporal"
  sudo "$temporal/aws/install" --update
  rm -r "$temporal"
fi

if ! existe ansible-playbook; then
  paso "Ansible (ansible-core con pipx)"
  pipx install --include-deps ansible-core
  pipx ensurepath
fi

paso "Versiones"
terraform version | head -1
aws --version
"$HOME/.local/bin/ansible-playbook" --version 2> /dev/null | head -1 || ansible-playbook --version | head -1
jq --version

if docker version > /dev/null 2>&1; then
  echo "Docker disponible: $(docker version --format '{{.Server.Version}}')"
else
  echo "⚠ Docker no responde en esta terminal. En Docker Desktop active Settings → Resources →"
  echo "  WSL Integration → Ubuntu, y abra una terminal nueva."
fi

echo
echo "Listo. Abra una terminal nueva (o ejecute: source ~/.bashrc) para usar ansible-playbook."
