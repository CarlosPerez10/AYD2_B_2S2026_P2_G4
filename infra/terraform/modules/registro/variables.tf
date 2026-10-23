variable "repositorios" {
  type = list(string)
}

variable "imagenes_a_retener" {
  type = number
}

variable "forzar_eliminacion" {
  description = "Permite borrar repositorios que todavía tienen imágenes."
  type        = bool
}
