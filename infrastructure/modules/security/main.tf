# EKS Cluster Control Plane Security Group
resource "aws_security_group" "cluster" {
  name_prefix = "${var.cluster_name}-cluster-sg-"
  description = "Security group for EKS control plane communication with worker nodes"
  vpc_id      = var.vpc_id

  egress {
    description = "Allow control plane outbound communication to worker nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-cluster-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# EKS Worker Nodes Security Group
resource "aws_security_group" "nodes" {
  name_prefix = "${var.cluster_name}-node-sg-"
  description = "Security group for all worker nodes in the EKS cluster"
  vpc_id      = var.vpc_id

  egress {
    description = "Allow nodes to communicate with external endpoints and repositories"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name                                        = "${var.cluster_name}-node-sg"
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Allow worker nodes to communicate with each other (Pod network, CoreDNS, flannel/calico/vpc-cni)
resource "aws_security_group_rule" "nodes_internal" {
  description              = "Allow inter-node communication for pods and cluster services"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.nodes.id
  source_security_group_id = aws_security_group.nodes.id
}

# Allow worker nodes to communicate with control plane API server (HTTPS)
resource "aws_security_group_rule" "cluster_ingress_nodes" {
  description              = "Allow worker nodes to reach the EKS cluster API server"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.cluster.id
  source_security_group_id = aws_security_group.nodes.id
}

# Allow control plane to communicate with worker nodes (Kubelet, extension APIs)
resource "aws_security_group_rule" "nodes_ingress_cluster_https" {
  description              = "Allow control plane to communicate with worker nodes on port 443"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.nodes.id
  source_security_group_id = aws_security_group.cluster.id
}

resource "aws_security_group_rule" "nodes_ingress_cluster_kubelet" {
  description              = "Allow control plane to communicate with worker node kubelet (port 10250)"
  type                     = "ingress"
  from_port                = 10250
  to_port                  = 10250
  protocol                 = "tcp"
  security_group_id        = aws_security_group.nodes.id
  source_security_group_id = aws_security_group.cluster.id
}

