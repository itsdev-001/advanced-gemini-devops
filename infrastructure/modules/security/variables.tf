variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster used for resource naming"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}

