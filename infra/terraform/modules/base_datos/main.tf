resource "aws_db_subnet_group" "privado" {
  name       = "${var.nombre}-privado"
  subnet_ids = var.subredes_ids
}

resource "aws_db_instance" "servicio" {
  # nonsensitive: las llaves (libros, ventas) no son secretas, solo las contraseñas.
  for_each = nonsensitive(toset(keys(var.bases)))

  identifier     = "${var.nombre}-${each.key}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.clase_instancia

  db_name  = var.bases[each.key].nombre_bd
  username = var.bases[each.key].usuario
  password = var.bases[each.key].contrasena

  allocated_storage     = 20
  max_allocated_storage = 100 # autoescalado de disco
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.privado.name
  vpc_security_group_ids = [var.bases[each.key].grupo_seguridad_id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period    = 1
  auto_minor_version_upgrade = true
  apply_immediately          = true

  skip_final_snapshot       = var.eliminar_sin_copia
  final_snapshot_identifier = var.eliminar_sin_copia ? null : "${var.nombre}-${each.key}-final"
  deletion_protection       = false

  tags = { Name = "${var.nombre}-rds-${each.key}" }
}
