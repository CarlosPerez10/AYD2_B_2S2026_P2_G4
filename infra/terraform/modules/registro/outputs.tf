output "registro" {
  value = "${data.aws_caller_identity.actual.account_id}.dkr.ecr.${data.aws_region.actual.name}.amazonaws.com"
}

output "urls" {
  value = { for nombre, repo in aws_ecr_repository.imagen : nombre => repo.repository_url }
}

output "arns" {
  value = [for repo in aws_ecr_repository.imagen : repo.arn]
}
