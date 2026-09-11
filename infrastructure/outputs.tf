# VPC Outputs
output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs where EKS worker nodes reside"
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = module.vpc.nat_gateway_ids
}

# Security Outputs
output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS control plane"
  value       = module.security.cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS worker nodes"
  value       = module.security.node_security_group_id
}

# IAM Outputs
output "cluster_iam_role_arn" {
  description = "ARN of the IAM role assumed by the EKS control plane"
  value       = module.iam.cluster_role_arn
}

output "node_iam_role_arn" {
  description = "ARN of the IAM role assumed by the EKS worker node group"
  value       = module.iam.node_role_arn
}

output "kms_key_arn" {
  description = "ARN of the KMS customer managed key for Kubernetes secrets envelope encryption"
  value       = module.iam.kms_key_arn
}

# EKS Outputs
output "cluster_id" {
  description = "The EKS cluster identifier"
  value       = module.eks.cluster_id
}

output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint URL for Amazon EKS Kubernetes API server"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "cluster_version" {
  description = "The Kubernetes server version of the EKS cluster"
  value       = module.eks.cluster_version
}

output "oidc_provider_arn" {
  description = "ARN of the IAM OpenID Connect provider for IAM Roles for Service Accounts (IRSA)"
  value       = module.eks.oidc_provider_arn
}

output "node_group_id" {
  description = "The ID of the managed node group"
  value       = module.eks.node_group_id
}

output "node_group_status" {
  description = "Status of the managed node group"
  value       = module.eks.node_group_status
}

# Kubectl Helper Command
output "configure_kubectl_command" {
  description = "AWS CLI command to configure local kubeconfig for the cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

# AWS Load Balancer Controller IRSA Role
output "load_balancer_controller_role_arn" {
  description = "ARN of the IAM role for the AWS Load Balancer Controller service account (IRSA)"
  value       = module.eks.load_balancer_controller_role_arn
}


