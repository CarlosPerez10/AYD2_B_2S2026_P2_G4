data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "operador" {
  key_name   = "${var.nombre}-operador"
  public_key = var.llave_publica
}

# ---------- Permisos: lectura de ECR mediante el rol de la instancia ----------
locals {
  crear_rol = var.perfil_instancia == ""
}

data "aws_iam_policy_document" "asumir_ec2" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vm" {
  count = local.crear_rol ? 1 : 0

  name               = "${var.nombre}-vm"
  assume_role_policy = data.aws_iam_policy_document.asumir_ec2.json
}

resource "aws_iam_role_policy_attachment" "lectura_ecr" {
  count = local.crear_rol ? 1 : 0

  role       = aws_iam_role.vm[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "vm" {
  count = local.crear_rol ? 1 : 0

  name = "${var.nombre}-vm"
  role = aws_iam_role.vm[0].name
}

# ---------- Máquinas virtuales ----------
resource "aws_instance" "vm" {
  for_each = var.instancias

  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.tipo_instancia
  subnet_id              = each.value.subred_id
  vpc_security_group_ids = [each.value.grupo_seguridad_id]
  key_name               = aws_key_pair.operador.key_name
  iam_instance_profile   = local.crear_rol ? aws_iam_instance_profile.vm[0].name : var.perfil_instancia

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  # IMDSv2 obligatorio; el ayudante de credenciales de ECR lo soporta.
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tags = { Name = "${var.nombre}-${each.key}", Rol = each.key }

  lifecycle {
    # Una AMI nueva de Canonical no debe reemplazar las VMs en cada apply.
    ignore_changes = [ami]
  }
}

# IP públicas estáticas (requisito del enunciado).
resource "aws_eip" "vm" {
  for_each = var.instancias

  domain   = "vpc"
  instance = aws_instance.vm[each.key].id

  tags = { Name = "${var.nombre}-${each.key}-eip" }
}
