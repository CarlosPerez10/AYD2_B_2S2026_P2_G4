variable "nombre" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "ip_operador" {
  description = "CIDR desde el que se permite SSH."
  type        = string
}
