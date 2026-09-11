variable "aws_region" {
  description = "AWS region for provisioning infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project identifier used in tagging and naming"
  type        = string
  default     = "advanced-gemini-devops"
}

variable "cluster_name" {
  description = "Name of the Amazon EKS cluster"
  type        = string
  default     = "advanced-gemini-devops-production"
}

variable "kubernetes_version" {
  description = "Kubernetes control plane and worker node version"
  type        = string
  default     = "1.30"
}

# Networking Variables
variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ subnet deployment"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (worker nodes & internal workloads)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "single_nat_gateway" {
  description = "Whether to deploy a single NAT Gateway across all AZs to minimize demo/portfolio costs"
  type        = bool
  default     = true
}

# EKS Compute Variables
variable "node_instance_types" {
  description = "EC2 instance types for EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
  default     = ["c7i-flex.large"]
}

variable "node_capacity_type" {
  description = "Capacity type for worker instances (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_desired_size" {
  description = "Desired number of worker instances in the node group"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker instances"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker instances"
  type        = number
  default     = 3
}

variable "node_disk_size" {
  description = "Root disk volume size in GB for worker instances"
  type        = number
  default     = 20
}

# Security & Encryption Variables
variable "enable_kms_secrets_encryption" {
  description = "Enable AWS KMS customer managed key envelope encryption for Kubernetes secrets"
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Whether the Amazon EKS public API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "endpoint_private_access" {
  description = "Whether the Amazon EKS private API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks allowed to communicate with the EKS public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

