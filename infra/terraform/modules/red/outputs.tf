output "vpc_id" {
  value = aws_vpc.principal.id
}

output "cidr_vpc" {
  value = aws_vpc.principal.cidr_block
}

output "subredes_publicas_ids" {
  value = aws_subnet.publica[*].id
}

output "subredes_privadas_ids" {
  value = aws_subnet.privada[*].id
}
