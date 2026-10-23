resource "aws_vpc" "principal" {
  cidr_block           = var.cidr_vpc
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.nombre}-vpc" }
}

resource "aws_internet_gateway" "principal" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = "${var.nombre}-igw" }
}

resource "aws_subnet" "publica" {
  count = length(var.subredes_publicas)

  vpc_id                  = aws_vpc.principal.id
  cidr_block              = var.subredes_publicas[count.index]
  availability_zone       = var.zonas[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.nombre}-publica-${var.zonas[count.index]}" }
}

resource "aws_subnet" "privada" {
  count = length(var.subredes_privadas)

  vpc_id            = aws_vpc.principal.id
  cidr_block        = var.subredes_privadas[count.index]
  availability_zone = var.zonas[count.index]

  tags = { Name = "${var.nombre}-privada-${var.zonas[count.index]}" }
}

resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.principal.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.principal.id
  }

  tags = { Name = "${var.nombre}-rutas-publicas" }
}

resource "aws_route_table_association" "publica" {
  count = length(aws_subnet.publica)

  subnet_id      = aws_subnet.publica[count.index].id
  route_table_id = aws_route_table.publica.id
}

# Las subredes privadas solo tienen la ruta local de la VPC: sin salida a Internet.
resource "aws_route_table" "privada" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = "${var.nombre}-rutas-privadas" }
}

resource "aws_route_table_association" "privada" {
  count = length(aws_subnet.privada)

  subnet_id      = aws_subnet.privada[count.index].id
  route_table_id = aws_route_table.privada.id
}
