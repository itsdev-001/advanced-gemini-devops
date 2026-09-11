variable "cluster_name" {
  description = "Name of the EKS cluster used for IAM role and KMS resource naming"
  type        = string
}

variable "enable_kms_encryption" {
  description = "Whether to provision an AWS KMS customer managed key for EKS secret envelope encryption"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

