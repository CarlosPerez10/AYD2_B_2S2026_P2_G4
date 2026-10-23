resource "aws_lb" "publico" {
  name               = "${var.nombre}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = var.subredes_ids
  security_groups    = [var.grupo_seguridad_id]
  idle_timeout       = 60

  # Encabezados HTTP inválidos se descartan antes de llegar al gateway.
  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "frontend" {
  name     = "tg-frontend"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group" "gateway" {
  name     = "tg-gateway"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group_attachment" "frontend" {
  target_group_arn = aws_lb_target_group.frontend.arn
  target_id        = var.instancia_frontend
  port             = 80
}

resource "aws_lb_target_group_attachment" "gateway" {
  target_group_arn = aws_lb_target_group.gateway.arn
  target_id        = var.instancia_frontend
  port             = 8080
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.publico.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  condition {
    path_pattern {
      values = ["/api/*", "/health*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}
