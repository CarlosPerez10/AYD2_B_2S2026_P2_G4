terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Estado local por defecto. Para trabajo en equipo se puede mover a S3:
  # backend "s3" { bucket = "...", key = "libreria-ayd/terraform.tfstate", region = "us-east-1" }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Proyecto   = "libreria-ayd"
      Entorno    = var.entorno
      Gestionado = "terraform"
    }
  }
}

module "red" {
  source = "./modules/red"

  nombre            = var.nombre
  cidr_vpc          = var.cidr_vpc
  zonas             = var.zonas
  subredes_publicas = var.subredes_publicas
  subredes_privadas = var.subredes_privadas
}

module "seguridad" {
  source = "./modules/seguridad"

  nombre      = var.nombre
  vpc_id      = module.red.vpc_id
  ip_operador = var.ip_operador
}

module "registro" {
  source = "./modules/registro"

  repositorios       = ["frontend", "api-gateway", "libros", "ventas"]
  imagenes_a_retener = 10
  forzar_eliminacion = var.forzar_eliminacion
}

module "computo" {
  source = "./modules/computo"

  nombre           = var.nombre
  tipo_instancia   = var.tipo_instancia
  llave_publica    = var.llave_publica
  perfil_instancia = var.perfil_instancia

  # frontend y libros en la zona a, ventas en la zona b (03-despliegue §3.1).
  instancias = {
    frontend = { subred_id = module.red.subredes_publicas_ids[0], grupo_seguridad_id = module.seguridad.ids.frontend }
    libros   = { subred_id = module.red.subredes_publicas_ids[0], grupo_seguridad_id = module.seguridad.ids.libros }
    ventas   = { subred_id = module.red.subredes_publicas_ids[1], grupo_seguridad_id = module.seguridad.ids.ventas }
  }
}

module "balanceador" {
  source = "./modules/balanceador"

  nombre             = var.nombre
  vpc_id             = module.red.vpc_id
  subredes_ids       = module.red.subredes_publicas_ids
  grupo_seguridad_id = module.seguridad.ids.alb
  instancia_frontend = module.computo.ids_instancias.frontend
}

module "base_datos" {
  source = "./modules/base_datos"

  nombre             = var.nombre
  subredes_ids       = module.red.subredes_privadas_ids
  clase_instancia    = var.clase_base_datos
  eliminar_sin_copia = var.forzar_eliminacion

  bases = {
    libros = {
      nombre_bd          = "libros_db"
      usuario            = "libros"
      contrasena         = var.contrasena_bd_libros
      grupo_seguridad_id = module.seguridad.ids.rds_libros
    }
    ventas = {
      nombre_bd          = "ventas_db"
      usuario            = "ventas"
      contrasena         = var.contrasena_bd_ventas
      grupo_seguridad_id = module.seguridad.ids.rds_ventas
    }
  }
}
