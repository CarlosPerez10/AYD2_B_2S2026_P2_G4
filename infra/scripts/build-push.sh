#!/usr/bin/env bash
# Construye las cuatro imágenes y las publica en ECR con la etiqueta <version> y latest.
#
#   ./infra/scripts/build-push.sh 1.0.0
#
# Variables opcionales: AWS_REGION (por defecto la salida "region" de Terraform),
# REGISTRO_ECR (por defecto la salida "registro_ecr").
set -euo pipefail

VERSION="${1:?Uso: build-push.sh <version>  (p. ej. 1.0.0)}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
TERRAFORM="$RAIZ/infra/terraform"

salida() { terraform -chdir="$TERRAFORM" output -raw "$1"; }
REGION="${AWS_REGION:-$(salida region)}"
REGISTRO="${REGISTRO_ECR:-$(salida registro_ecr)}"

# imagen → carpeta con su Dockerfile
declare -A CONTEXTOS=(
  [frontend]="frontend"
  [api-gateway]="api-gateway"
  [libros]="services/libros"
  [ventas]="services/ventas"
)

echo "→ Iniciando sesión en $REGISTRO"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRO"

for imagen in "${!CONTEXTOS[@]}"; do
  destino="$REGISTRO/$imagen"
  echo "→ Construyendo $imagen:$VERSION"
  # Las VMs son x86_64 (t3.micro); se fija la plataforma por si se construye en ARM.
  docker build --platform linux/amd64 -t "$destino:$VERSION" -t "$destino:latest" "$RAIZ/${CONTEXTOS[$imagen]}"
  docker push "$destino:$VERSION"
  docker push "$destino:latest"
done

echo "✓ Imágenes publicadas con la versión $VERSION"
