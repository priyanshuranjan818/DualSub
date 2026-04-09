variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "The EC2 instance type for the K3s node"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "AWS SSH Key Pair Name"
  type        = string
  default     = "learnwithme-key"
}
