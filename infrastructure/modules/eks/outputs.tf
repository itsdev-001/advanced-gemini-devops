output "cluster_id" {
  description = "The ID of the EKS cluster"
  value       = aws_eks_cluster.this.id
}

output "cluster_arn" {
  description = "The ARN of the EKS cluster"
  value       = aws_eks_cluster.this.arn
}

output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "The endpoint URL of the EKS Kubernetes API server"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.this.certificate_authority[0].data
  sensitive   = true
}

output "cluster_version" {
  description = "The Kubernetes server version of the cluster"
  value       = aws_eks_cluster.this.version
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider for IAM Roles for Service Accounts (IRSA)"
  value       = aws_iam_openid_connect_provider.this.arn
}

output "node_group_id" {
  description = "The ID of the EKS Node Group"
  value       = aws_eks_node_group.this.id
}

output "node_group_arn" {
  description = "The ARN of the EKS Node Group"
  value       = aws_eks_node_group.this.arn
}

output "node_group_status" {
  description = "Status of the EKS Node Group"
  value       = aws_eks_node_group.this.status
}

output "load_balancer_controller_role_arn" {
  description = "ARN of the IAM role for the AWS Load Balancer Controller Service Account (IRSA)"
  value       = aws_iam_role.load_balancer_controller.arn
}


