output "cluster_security_group_id" {
  description = "The security group ID attached to the EKS control plane"
  value       = aws_security_group.cluster.id
}

output "node_security_group_id" {
  description = "The security group ID attached to the EKS worker nodes"
  value       = aws_security_group.nodes.id
}

