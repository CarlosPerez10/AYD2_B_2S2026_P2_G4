# HTTPS público sin dominio propio: CloudFront delante del ALB.
#
# Los navegadores móviles intentan primero https://, y el ALB solo escucha en el puerto 80.
# CloudFront entrega https://<id>.cloudfront.net con el certificado de AWS y reenvía todo
# al ALB por HTTP; el ALB sigue enrutando /api/* al gateway y el resto al frontend.

data "aws_cloudfront_cache_policy" "sin_cache" {
  name = "Managed-CachingDisabled"
}

# Reenvía encabezados (X-Api-Key, X-Request-Id), query strings y cookies; no el Host,
# porque el ALB espera su propio nombre.
data "aws_cloudfront_origin_request_policy" "todo_menos_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "web" {
  enabled         = true
  comment         = "${var.nombre}: HTTPS publico frente al ALB"
  price_class     = "PriceClass_100"
  is_ipv6_enabled = true

  origin {
    origin_id   = "alb"
    domain_name = module.balanceador.dns

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 30
    }
  }

  default_cache_behavior {
    target_origin_id         = "alb"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.sin_cache.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.todo_menos_host.id
    compress                 = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = { Name = "${var.nombre}-cdn" }
}

output "url_https" {
  description = "URL pública con HTTPS (funciona en celulares y cualquier red)."
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}
