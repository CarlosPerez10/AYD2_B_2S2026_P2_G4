output "endpoints" {
  description = "Host de cada base (sin puerto)."
  value       = { for nombre, bd in aws_db_instance.servicio : nombre => bd.address }
}
