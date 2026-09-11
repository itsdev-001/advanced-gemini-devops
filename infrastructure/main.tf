# ==============================================================================
# AWS Provider Configuration
# ==============================================================================
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# Module: VPC & Networking
# Multi-AZ subnets, Internet Gateway, cost-optimized NAT Gateway, Route Tables
# ==============================================================================
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  cluster_name         = var.cluster_name
  single_nat_gateway   = var.single_nat_gateway
  tags                 = local.local_tags_merged
}

locals {
  local_tags_merged = merge(
    local.common_tags,
    {
      "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    }
  )
}

# ==============================================================================
# Module: Security Groups
# Control plane security group, worker node security group, and inter-node rules
# ==============================================================================
module "security" {
  source = "./modules/security"

  vpc_id       = module.vpc.vpc_id
  cluster_name = var.cluster_name
  tags         = local.common_tags
}

# ==============================================================================
# Module: IAM Roles & KMS Encryption
# EKS cluster role, node group role, and KMS key for envelope encryption
# ==============================================================================
module "iam" {
  source = "./modules/iam"

  cluster_name          = var.cluster_name
  enable_kms_encryption = var.enable_kms_secrets_encryption
  tags                  = local.common_tags
}

# ==============================================================================
# Module: Amazon EKS Cluster & Managed Node Group
# Production Kubernetes cluster with CloudWatch logging and private worker nodes
# ==============================================================================
module "eks" {
  source = "./modules/eks"

  cluster_name              = var.cluster_name
  kubernetes_version        = var.kubernetes_version
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  public_subnet_ids         = module.vpc.public_subnet_ids
  cluster_role_arn          = module.iam.cluster_role_arn
  node_role_arn             = module.iam.node_role_arn
  cluster_security_group_id = module.security.cluster_security_group_id
  node_security_group_id    = module.security.node_security_group_id
  enable_kms_encryption     = var.enable_kms_secrets_encryption
  kms_key_arn               = module.iam.kms_key_arn
  endpoint_private_access   = var.endpoint_private_access
  endpoint_public_access    = var.endpoint_public_access
  public_access_cidrs       = var.public_access_cidrs
  instance_types            = var.node_instance_types
  capacity_type             = var.node_capacity_type
  desired_size              = var.node_desired_size
  min_size                  = var.node_min_size
  max_size                  = var.node_max_size
  disk_size                 = var.node_disk_size
  tags                      = local.common_tags
}

