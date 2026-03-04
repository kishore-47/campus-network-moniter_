# AWS Deployment Guide

This guide covers deploying Campus Network Monitor on AWS using EKS (Elastic Kubernetes Service).

## Prerequisites

- AWS Account with IAM permissions
- AWS CLI configured
- `kubectl` and `helm` installed
- Docker images pushed to ECR

## Quick Start

### 1. Create EKS Cluster

```bash
# Set variables
export AWS_REGION=us-east-1
export CLUSTER_NAME=campus-monitor-cluster
export NODE_COUNT=2
export NODE_TYPE=t3.medium

# Create cluster
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --nodegroup-name standard-nodes \
  --node-type $NODE_TYPE \
  --nodes $NODE_COUNT \
  --managed
```

### 2. Create ECR Repositories

```bash
# Backend repo
aws ecr create-repository \
  --repository-name campus-network-monitor-backend \
  --region $AWS_REGION

# Frontend repo
aws ecr create-repository \
  --repository-name campus-network-monitor-frontend \
  --region $AWS_REGION
```

### 3. Push Docker Images

```bash
# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
docker build -t campus-network-monitor-backend ./backend
docker tag campus-network-monitor-backend:latest \
  <ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com/campus-network-monitor-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com/campus-network-monitor-backend:latest

# Build and push frontend
docker build -t campus-network-monitor-frontend ./frontend
docker tag campus-network-monitor-frontend:latest \
  <ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com/campus-network-monitor-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com/campus-network-monitor-frontend:latest
```

### 4. Deploy with Helm

```bash
# Create namespace
kubectl create namespace campus-monitor

# Deploy
helm install campus-monitor ./helm/campus-network-monitor \
  --namespace campus-monitor \
  -f deploy/aws/values.yaml
```

### 5. Setup Load Balancer

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system

# Create ALB Ingress (see alb-ingress.yaml)
kubectl apply -f deploy/aws/alb-ingress.yaml
```

## Monitoring & Logging

### CloudWatch Logs

Container logs are automatically sent to CloudWatch. View them:

```bash
kubectl logs -f deployment/campus-backend -n campus-monitor
kubectl logs -f deployment/campus-frontend -n campus-monitor
```

### CloudWatch Metrics

Install CloudWatch Container Insights for pod/node metrics:

```bash
ClusterName=campus-monitor-cluster
RegionName=us-east-1
FluentBitHttpPort='2020'
FluentBitReadFromHead='Off'

[[ ${FluentBitReadFromHead} = 'On' ]] && FLB_READ_FROM_HEAD='-o parsers.multiline_parser=docker,cri' || FLB_READ_FROM_HEAD=''

helm repo add aws https://aws.github.io/eks-charts
helm repo update
helm upgrade --install aws-for-fluent-bit aws/aws-for-fluent-bit \
  --set cloudWatch.selfConfiguration=true \
  --set cloudWatch.enabled=true \
  --set serviceAccount.create=true \
  -n amazon-cloudwatch
```

## Cleanup

```bash
# Delete Helm release
helm uninstall campus-monitor -n campus-monitor

# Delete EKS cluster
eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION
```

## Cost Optimization

- Use t3.medium or t3.small for non-production
- Configure autoscaling (Cluster Autoscaler or Karpenter)
- Use spot instances for dev/test environments
- Monitor costs with AWS Cost Explorer

## Additional Resources

- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [ALB Ingress Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
