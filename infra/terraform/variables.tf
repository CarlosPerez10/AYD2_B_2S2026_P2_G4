variable "region" {
  description = "Región de AWS."
  type        = string
  default     = "us-east-1"
}

variable "entorno" {
  description = "Nombre del entorno (se usa en las etiquetas)."
  type        = string
  default     = "produccion"
}

variable "nombre" {
  description = "Prefijo para los nombres de los recursos."
  type        = string
  default     = "libreria-ayd"
}

variable "cidr_vpc" {
  type    = string
  default = "10.0.0.0/16"
}

variable "zonas" {
  description = "Dos zonas de disponibilidad (el ALB y RDS las exigen)."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.zonas) == 2
    error_message = "Se necesitan exactamente dos zonas de disponibilidad."
  }
}

variable "subredes_publicas" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "subredes_privadas" {
  type    = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "ip_operador" {
  description = "IP pública del operador en formato CIDR (p. ej. 190.56.10.20/32); única origen permitido para SSH."
  type        = string

  validation {
    condition     = can(cidrhost(var.ip_operador, 0)) && var.ip_operador != "0.0.0.0/0"
    error_message = "ip_operador debe ser un CIDR válido y no puede ser 0.0.0.0/0."
  }
}

variable "llave_publica" {
  description = "Contenido de la llave pública SSH que se instala en las VMs (texto de ~/.ssh/libreria-ayd.pub)."
  type        = string
}

variable "tipo_instancia" {
  type    = string
  default = "t3.micro"
}

variable "perfil_instancia" {
  description = "Perfil de instancia existente (AWS Academy: \"LabInstanceProfile\"). Vacío = Terraform crea el rol con lectura de ECR."
  type        = string
  default     = ""
}

variable "clase_base_datos" {
  type    = string
  default = "db.t3.micro"
}

variable "contrasena_bd_libros" {
  description = "Contraseña maestra de RDS libros (mínimo 8 caracteres, sin /, @, \" ni espacios)."
  type        = string
  sensitive   = true
}

variable "contrasena_bd_ventas" {
  description = "Contraseña maestra de RDS ventas."
  type        = string
  sensitive   = true
}

variable "forzar_eliminacion" {
  description = "Permite que terraform destroy borre repositorios con imágenes y RDS sin snapshot final."
  type        = bool
  default     = true
}
