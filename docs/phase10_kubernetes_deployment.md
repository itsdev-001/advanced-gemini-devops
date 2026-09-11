# Phase 10: Production Kubernetes + Helm Deployment Guide

This guide documents the production deployment of the Gemini AI Platform to Amazon Elastic Kubernetes Service (EKS) in region `ap-south-1` using Helm and AWS Load Balancer Controller.

---

## 1. Architecture Overview

```
                          [ Internet Traffic ]
                                   │
                                   ▼
         [ AWS Application Load Balancer (ALB) - Public Subnets ]
                 DNS: k8s-advanced-advanced-1896bafd50-...
                                   │
                    HTTP 80 / Target Type: IP
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
       [ Pod: advanced-gemini-1 ]      [ Pod: advanced-gemini-2 ]
        IP: 10.0.10.x (ap-south-1a)      IP: 10.0.20.x (ap-south-1b)
          Node: worker-node-1              Node: worker-node-2
       (Private Subnet 10.0.10.0/24)    (Private Subnet 10.0.20.0/24)
                   │                               │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
               [ Outbound Traffic via NAT Gateway ]
                   (ECR image pulls, Google AI API)
```

### Key Components
* **Cluster**: `advanced-gemini-devops-production` (Kubernetes v1.30)
* **Node Group**: `advanced-gemini-devops-production-managed-nodes` (2x `c7i-flex.large` nodes in private subnets)
* **Namespace**: `advanced-gemini`
* **Container Registry**: Amazon ECR `552916920151.dkr.ecr.ap-south-1.amazonaws.com/advanced-gemini-devops`
* **Image Tag**: `507e09dbf2a7fc92ea523022b8c6a05f8612cab9` (Immutable Git Commit SHA)
* **Ingress Controller**: AWS Load Balancer Controller v3.5.0 in `kube-system` via IRSA
* **Autoscaling**: HorizontalPodAutoscaler (HPA) targeting CPU (80%) and Memory (80%) via `metrics-server`
* **High Availability**: PodDisruptionBudget (PDB minAvailable: 1), PodAntiAffinity across availability zones, RollingUpdate (maxSurge: 1, maxUnavailable: 0)

---

## 2. Directory Structure

```text
advanced-gemini-devops/
├── helm/
│   └── advanced-gemini/
│       ├── Chart.yaml                  # Chart metadata and versioning
│       ├── values.yaml                 # Production default configurations
│       └── templates/
│           ├── _helpers.tpl            # Template naming helpers
│           ├── deployment.yaml         # App Deployment with probes & security context
│           ├── service.yaml            # ClusterIP Service (port 80 -> 3000)
│           ├── serviceaccount.yaml     # Dedicated ServiceAccount
│           ├── configmap.yaml          # Non-sensitive runtime configuration
│           ├── secret.yaml             # Secret template (optional in-chart creation)
│           ├── ingress.yaml            # ALB Ingress specification (target-type: ip)
│           ├── hpa.yaml                # HorizontalPodAutoscaler
│           └── pdb.yaml                # PodDisruptionBudget
├── kubernetes/                         # Standalone Kubernetes YAML manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret-example.yaml             # Safe template (no real keys)
│   ├── serviceaccount.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── pdb.yaml
```

---

## 3. Secret Management Strategy

> [!IMPORTANT]
> **Zero Secrets in Git**: Real API keys, tokens, and certificates are NEVER committed to version control.

### Runtime Secret Injection
The application mounts the `GEMINI_API_KEY` environment variable from the Kubernetes Secret `advanced-gemini-secret`.

To create or update the secret imperatively at runtime:
```bash
kubectl create secret generic advanced-gemini-secret \
  --namespace advanced-gemini \
  --from-literal=GEMINI_API_KEY="<YOUR_ACTUAL_GOOGLE_AI_STUDIO_KEY>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 4. Deployment Commands

### Step 1: Connect to the EKS Cluster
```bash
aws eks update-kubeconfig --region ap-south-1 --name advanced-gemini-devops-production
kubectl cluster-info
kubectl get nodes
```

### Step 2: Ensure Dedicated Namespace Exists
```bash
kubectl create namespace advanced-gemini --dry-run=client -o yaml | kubectl apply -f -
```

### Step 3: Lint and Validate Helm Chart
```bash
helm lint helm/advanced-gemini
helm template advanced-gemini helm/advanced-gemini -n advanced-gemini
```

### Step 4: Deploy with Helm
```bash
helm upgrade --install advanced-gemini helm/advanced-gemini \
  --namespace advanced-gemini \
  --create-namespace
```

---

## 5. Verification Commands

### Check Workloads & Networking
```bash
# Verify Pods & Deployments
kubectl get pods -n advanced-gemini -o wide
kubectl get deployment advanced-gemini -n advanced-gemini

# Verify Service & Ingress
kubectl get service advanced-gemini -n advanced-gemini
kubectl get ingress advanced-gemini -n advanced-gemini

# Verify Autoscaling & Disruption Budget
kubectl get hpa advanced-gemini -n advanced-gemini
kubectl get pdb advanced-gemini -n advanced-gemini

# Verify Helm Release
helm list -n advanced-gemini
```

### Check Ingress Load Balancer
```bash
# Obtain ALB DNS hostname
kubectl get ingress advanced-gemini -n advanced-gemini -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test Healthcheck via ALB
curl -I http://<ALB_DNS_HOSTNAME>/api/health
```

---

## 6. Security Posture

1. **Unprivileged Execution**: Pod runs with `runAsNonRoot: true`, UID `1001`, GID `1001`.
2. **Privilege Escalation**: `allowPrivilegeEscalation: false`.
3. **Capabilities**: `drop: ["ALL"]`.
4. **Network Isolation**: Worker nodes and application pods run strictly in private subnets with no public IPv4 addresses; inbound traffic flows exclusively through the AWS ALB.
5. **Least-Privilege IRSA**: AWS Load Balancer Controller runs with a scoped IAM role bound via OIDC web identity federation to `system:serviceaccount:kube-system:aws-load-balancer-controller`.

