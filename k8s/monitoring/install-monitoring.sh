#!/bin/bash
set -e

echo "Installing Prometheus and Grafana stack using Helm..."

# Add promising Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install the stack into the monitoring namespace
helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.service.type=LoadBalancer

echo "Monitoring stack installed. Give it a couple of minutes to spin up the pods."
echo "You can check Grafana using: kubectl get svc -n monitoring"
