variable "nombre" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subredes_ids" {
  description = "Subredes públicas (dos zonas)."
  type        = list(string)
}

variable "grupo_seguridad_id" {
  type = string
}

variable "instancia_frontend" {
  description = "Id de la VM que aloja frontend (puerto 80) y api-gateway (puerto 8080)."
  type        = string
}
