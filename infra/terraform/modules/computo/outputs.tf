output "ids_instancias" {
  value = { for nombre, vm in aws_instance.vm : nombre => vm.id }
}

output "ips_elasticas" {
  value = { for nombre, ip in aws_eip.vm : nombre => ip.public_ip }
}

output "ips_privadas" {
  value = { for nombre, vm in aws_instance.vm : nombre => vm.private_ip }
}
