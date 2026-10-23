data "aws_caller_identity" "actual" {}
data "aws_region" "actual" {}

resource "aws_ecr_repository" "imagen" {
  for_each = toset(var.repositorios)

  name                 = each.key
  image_tag_mutability = "MUTABLE" # la etiqueta latest se reescribe en cada versión
  force_delete         = var.forzar_eliminacion

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "retencion" {
  for_each = aws_ecr_repository.imagen

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Conservar las últimas ${var.imagenes_a_retener} imágenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.imagenes_a_retener
      }
      action = { type = "expire" }
    }]
  })
}
