output "region" {
  value = var.region
}

output "ips_elasticas" {
  description = "IP públicas estáticas de cada VM (SSH de Ansible y pruebas directas)."
  value       = module.computo.ips_elasticas
}

output "ips_privadas" {
  description = "IP privadas: el gateway y Ventas las usan para llegar a los microservicios."
  value       = module.computo.ips_privadas
}

output "dns_alb" {
  description = "Punto de entrada público de la plataforma."
  value       = module.balanceador.dns
}

output "endpoints_rds" {
  description = "Host de cada base de datos (sin puerto)."
  value       = module.base_datos.endpoints
}

output "registro_ecr" {
  description = "Host del registro (cuenta.dkr.ecr.region.amazonaws.com)."
  value       = module.registro.registro
}

output "urls_ecr" {
  value = module.registro.urls
}
