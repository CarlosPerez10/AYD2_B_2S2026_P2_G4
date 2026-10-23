variable "nombre" {
  type = string
}

variable "subredes_ids" {
  description = "Subredes privadas (dos zonas)."
  type        = list(string)
}

variable "clase_instancia" {
  type = string
}

variable "eliminar_sin_copia" {
  description = "true = terraform destroy no deja snapshot final."
  type        = bool
}

variable "bases" {
  description = "Una instancia RDS por microservicio."
  type = map(object({
    nombre_bd          = string
    usuario            = string
    contrasena         = string
    grupo_seguridad_id = string
  }))
  sensitive = true
}
