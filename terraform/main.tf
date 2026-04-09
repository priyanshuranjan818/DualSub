terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Network defaults - assuming deploying in Default VPC for simplicity
# In production, a dedicated VPC is recommended.
data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "k3s_sg" {
  name        = "k3s-node-sg"
  description = "Security group for K3s node instance"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K3s API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "learnwithme-sg"
  }
}

# Find latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "k3s_node" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.k3s_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  # User data to automatically install Docker, K3s and Helm
  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get upgrade -y

              # Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker

              # FIX: Wait for Docker daemon to be fully ready before K3s install
              echo "Waiting for Docker daemon..."
              until docker info >/dev/null 2>&1; do
                sleep 2
              done
              echo "Docker is ready."

              # Install K3s pointing public IP to TLS SAN for remote access
              export INSTALL_K3S_EXEC="server --tls-san $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) --docker"
              curl -sfL https://get.k3s.io | sh -

              # Provide access to kubeconfig for the ubuntu user
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube

              # Install Helm
              curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
              EOF

  tags = {
    Name = "learnwithme-k3s"
  }
}
