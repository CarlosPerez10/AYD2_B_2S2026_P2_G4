variable "nombre" {
  type = string
}

variable "tipo_instancia" {
  type = string
}

variable "llave_publica" {
  type = string
}

variable "perfil_instancia" {
  description = "Perfil existente; vacío para crear uno con lectura de ECR."
  type        = string
}

variable "instancias" {
  description = "VMs a crear: nombre => { subred_id, grupo_seguridad_id }."
  type = map(object({
    subred_id          = string
    grupo_seguridad_id = string
  }))
}
