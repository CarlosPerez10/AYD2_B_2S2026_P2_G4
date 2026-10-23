# Grupos de 03-despliegue §3.2. Las reglas de entrada referencian grupos, no rangos,
# así solo el componente previsto puede llegar a cada puerto.

locals {
  grupos = {
    alb        = "Entrada HTTP publica al balanceador"
    frontend   = "VM de frontend y api-gateway"
    libros     = "VM del microservicio de Libros"
    ventas     = "VM del microservicio de Ventas"
    rds_libros = "Base de datos de Libros"
    rds_ventas = "Base de datos de Ventas"
  }

  # [grupo destino, puerto, grupo origen]
  reglas_entre_grupos = {
    frontend_80_desde_alb    = ["frontend", 80, "alb"]
    frontend_8080_desde_alb  = ["frontend", 8080, "alb"]
    libros_3001_desde_front  = ["libros", 3001, "frontend"]
    libros_3001_desde_ventas = ["libros", 3001, "ventas"]
    ventas_3002_desde_front  = ["ventas", 3002, "frontend"]
    rds_libros_desde_libros  = ["rds_libros", 5432, "libros"]
    rds_ventas_desde_ventas  = ["rds_ventas", 5432, "ventas"]
  }

  vms = toset(["frontend", "libros", "ventas"])
}

resource "aws_security_group" "grupo" {
  for_each = local.grupos

  # AWS no permite nombres que empiecen con "sg-"; ese prefijo queda en la etiqueta Name.
  name        = "${var.nombre}-${replace(each.key, "_", "-")}"
  description = each.value
  vpc_id      = var.vpc_id

  tags = { Name = "sg-${replace(each.key, "_", "-")}" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.grupo["alb"].id
  description       = "HTTP desde Internet"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "entre_grupos" {
  for_each = local.reglas_entre_grupos

  security_group_id            = aws_security_group.grupo[each.value[0]].id
  referenced_security_group_id = aws_security_group.grupo[each.value[2]].id
  description                  = "TCP ${each.value[1]} desde sg-${replace(each.value[2], "_", "-")}"
  ip_protocol                  = "tcp"
  from_port                    = each.value[1]
  to_port                      = each.value[1]
}

resource "aws_vpc_security_group_ingress_rule" "ssh_operador" {
  for_each = local.vms

  security_group_id = aws_security_group.grupo[each.key].id
  description       = "SSH desde la IP del operador"
  cidr_ipv4         = var.ip_operador
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

# Salida abierta solo en las VMs (apt, descarga de imágenes de ECR, RDS y otros servicios).
resource "aws_vpc_security_group_egress_rule" "vms" {
  for_each = local.vms

  security_group_id = aws_security_group.grupo[each.key].id
  description       = "Salida completa"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# El ALB solo necesita salir hacia los puertos de la VM de frontend.
resource "aws_vpc_security_group_egress_rule" "alb_hacia_frontend" {
  for_each = toset(["80", "8080"])

  security_group_id            = aws_security_group.grupo["alb"].id
  referenced_security_group_id = aws_security_group.grupo["frontend"].id
  description                  = "Hacia frontend TCP ${each.value}"
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.value)
  to_port                      = tonumber(each.value)
}
