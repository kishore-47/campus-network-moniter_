# Azure Deployment Guide

This guide covers deploying Campus Network Monitor on Azure using AKS (Azure Kubernetes Service).

## Prerequisites

- Azure Account with subscription
- Azure CLI installed and authenticated
- `kubectl` and `helm` installed
- Docker images pushed to ACR

## Quick Start

### 1. Create Resource Group

```bash
export RESOURCE_GROUP=campus-monitor-rg
export LOCATION=eastus
export AKS_NAME=campus-aks

az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 2. Create Container Registry

```bash
export ACR_NAME=campusmonitoracr

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic
```

### 3. Create AKS Cluster

```bash
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 2 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity \
  --network-plugin azure \
  --attach-acr $ACR_NAME
```

### 4. Get Credentials

```bash
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME
```

### 5. Push Docker Images to ACR

```bash
# Login to ACR
az acr login --name $ACR_NAME

ACR_REGISTRY=$ACR_NAME.azurecr.io

# Build and push backend
docker build -t campus-network-monitor-backend ./backend
docker tag campus-network-monitor-backend:latest \
  $ACR_REGISTRY/campus-network-monitor-backend:latest
docker push $ACR_REGISTRY/campus-network-monitor-backend:latest

# Build and push frontend
docker build -t campus-network-monitor-frontend ./frontend
docker tag campus-network-monitor-frontend:latest \
  $ACR_REGISTRY/campus-network-monitor-frontend:latest
docker push $ACR_REGISTRY/campus-network-monitor-frontend:latest
```

### 6. Deploy with Helm

```bash
# Create namespace
kubectl create namespace campus-monitor

# Deploy
helm install campus-monitor ./helm/campus-network-monitor \
  --namespace campus-monitor \
  -f deploy/azure/values.yaml
```

### 7. Setup Load Balancer & DNS

```bash
# Create Application Gateway (or use Azure Load Balancer)
az network application-gateway create \
  --name campus-appgw \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_v2 \
  --http-settings-cookie-based-affinity Enabled \
  --frontend-port 443 \
  --http-settings-port 80 \
  --cert-password <PASSWORD>

# Get public IP
PUBLIC_IP=$(kubectl get svc -n campus-monitor campus-frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Frontend IP: $PUBLIC_IP"

# Create DNS A record
az network dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name example.com \
  --name monitor \
  --ipv4-address $PUBLIC_IP
```

## Monitoring & Logging

### Azure Monitor

Container Insights is automatically enabled. View metrics:

```bash
# View cluster health
az aks show --resource-group $RESOURCE_GROUP --name $AKS_NAME

# View pod metrics
kubectl top pods -n campus-monitor
```

### Log Analytics

```bash
# Query logs in Azure Log Analytics workspace
az monitor log-analytics query \
  --workspace $WORKSPACE_ID \
  --analytics-query "ContainerLog | where Pod startswith 'campus'"
```

### Application Insights

Add Application Insights for backend:

```bash
# Create Application Insights resource
az resource create \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Insights/components" \
  --name campus-appinsights \
  --properties '{"Application_Type":"web"}'
```

## Cleanup

```bash
# Delete Helm release
helm uninstall campus-monitor -n campus-monitor

# Delete AKS cluster
az aks delete \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --yes --no-wait

# Delete resource group
az group delete \
  --name $RESOURCE_GROUP \
  --yes --no-wait
```

## Cost Optimization

- Use B series VMs for non-production (burstable)
- Enable cluster autoscaling
- Use Azure Spot VMs for dev/test
- Monitor costs with Azure Cost Management

## Additional Resources

- [AKS Best Practices](https://docs.microsoft.com/en-us/azure/aks/best-practices)
- [ACR Documentation](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Application Gateway](https://docs.microsoft.com/en-us/azure/application-gateway/)
