output "k3s_node_public_ip" {
  description = "Public IP of the K3s node"
  value       = aws_instance.k3s_node.public_ip
}

output "kubernetes_api_endpoint" {
  description = "Endpoint for K8s API"
  value       = "https://${aws_instance.k3s_node.public_ip}:6443"
}
