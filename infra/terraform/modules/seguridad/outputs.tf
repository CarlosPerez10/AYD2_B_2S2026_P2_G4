output "ids" {
  description = "Id de cada grupo: alb, frontend, libros, ventas, rds_libros, rds_ventas."
  value       = { for clave, grupo in aws_security_group.grupo : clave => grupo.id }
}
