variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Desired Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "VPC ID where EKS cluster and nodes will reside"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for managed node group placement"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for control-plane VPC attachment"
  type        = list(string)
}

variable "cluster_role_arn" {
  description = "IAM role ARN for the EKS cluster control plane"
  type        = string
}

variable "node_role_arn" {
  description = "IAM role ARN for the EKS managed node group"
  type        = string
}

variable "cluster_security_group_id" {
  description = "Security group ID for the EKS cluster control plane"
  type        = string
}

variable "node_security_group_id" {
  description = "Security group ID for the EKS worker nodes"
  type        = string
}

variable "enable_kms_encryption" {
  description = "Whether to enable KMS envelope encryption for Kubernetes secrets"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "KMS Key ARN for secrets encryption"
  type        = string
  default     = null
}

variable "endpoint_private_access" {
  description = "Enable private API server endpoint access"
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Enable public API server endpoint access"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks allowed to access the public EKS API endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enabled_cluster_log_types" {
  description = "List of EKS control plane logging types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "instance_types" {
  description = "EC2 instance types for the managed node group"
  type        = list(string)
  default     = ["t3.medium"]
  default     = ["c7i-flex.large"]
}

variable "capacity_type" {
  description = "Type of capacity associated with the EKS Node Group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 3
}

variable "disk_size" {
  description = "Root EBS volume size in GB for worker node instances"
  type        = number
  default     = 20
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

