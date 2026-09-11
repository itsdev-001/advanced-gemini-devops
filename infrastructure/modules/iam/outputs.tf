output "cluster_role_arn" {
  description = "The ARN of the EKS cluster IAM role"
  value       = aws_iam_role.cluster.arn
}

output "cluster_role_name" {
  description = "The name of the EKS cluster IAM role"
  value       = aws_iam_role.cluster.name
}

output "node_role_arn" {
  description = "The ARN of the EKS node group IAM role"
  value       = aws_iam_role.nodes.arn
}

output "node_role_name" {
  description = "The name of the EKS node group IAM role"
  value       = aws_iam_role.nodes.name
}

output "kms_key_arn" {
  description = "The ARN of the KMS key created for EKS secrets envelope encryption (if enabled)"
  value       = var.enable_kms_encryption ? aws_kms_key.eks[0].arn : null
}

