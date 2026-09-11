# CloudWatch Log Group for EKS Control Plane Logging
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = merge(
    var.tags,
    {
      Name = "/aws/eks/${var.cluster_name}/cluster"
    }
  )
}

# EKS Cluster Control Plane
resource "aws_eks_cluster" "this" {
  name                      = var.cluster_name
  role_arn                  = var.cluster_role_arn
  version                   = var.kubernetes_version
  enabled_cluster_log_types = var.enabled_cluster_log_types

  vpc_config {
    subnet_ids              = concat(var.private_subnet_ids, var.public_subnet_ids)
    security_group_ids      = [var.cluster_security_group_id]
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs     = var.public_access_cidrs
  }

  dynamic "encryption_config" {
    for_each = var.enable_kms_encryption && var.kms_key_arn != null ? [1] : []
    content {
      provider {
        key_arn = var.kms_key_arn
      }
      resources = ["secrets"]
    }
  }

  tags = merge(
    var.tags,
    {
      Name = var.cluster_name
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.this
  ]
}

# EKS Managed Node Group (Worker Nodes placed exclusively on Private Subnets)
resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-managed-nodes"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids

  ami_type       = "AL2023_x86_64_STANDARD"
  instance_types = var.instance_types
  capacity_type  = var.capacity_type
  disk_size      = var.disk_size

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role        = "worker"
    environment = lookup(var.tags, "Environment", "production")
  }

  tags = merge(
    var.tags,
    {
      Name                                        = "${var.cluster_name}-worker-node"
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    }
  )

  lifecycle {
    create_before_destroy = true
    create_before_destroy = false
    ignore_changes        = [scaling_config[0].desired_size]
  }
}

# OIDC Identity Provider for IAM Roles for Service Accounts (IRSA)
data "tls_certificate" "this" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "this" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.this.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-irsa-oidc"
    }
  )
}

# ==============================================================================
# AWS Load Balancer Controller Prerequisites (IAM Policy, Role, and IRSA)
# ==============================================================================
resource "aws_iam_policy" "load_balancer_controller" {
  name        = "${var.cluster_name}-AWSLoadBalancerControllerIAMPolicy"
  description = "IAM policy for AWS Load Balancer Controller in EKS cluster ${var.cluster_name}"
  policy      = file("${path.module}/aws_load_balancer_controller_policy.json")

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-AWSLoadBalancerControllerIAMPolicy"
    }
  )
}

resource "aws_iam_role" "load_balancer_controller" {
  name        = "${var.cluster_name}-aws-load-balancer-controller"
  description = "IAM Role for AWS Load Balancer Controller Service Account via IRSA"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.this.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.this.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
            "${replace(aws_iam_openid_connect_provider.this.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-aws-load-balancer-controller"
    }
  )
}

resource "aws_iam_role_policy_attachment" "load_balancer_controller" {
  policy_arn = aws_iam_policy.load_balancer_controller.arn
  role       = aws_iam_role.load_balancer_controller.name
}


