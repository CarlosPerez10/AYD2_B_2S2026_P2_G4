variable "nombre" {
  type = string
}

variable "cidr_vpc" {
  type = string
}

variable "zonas" {
  type = list(string)
}

variable "subredes_publicas" {
  type = list(string)
}

variable "subredes_privadas" {
  type = list(string)
}
