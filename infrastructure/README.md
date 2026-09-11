# Production AWS Infrastructure with Terraform + Amazon EKS

This directory contains production-grade, modular, reusable Infrastructure as Code (IaC) using Terraform for provisioning the cloud foundation of the Gemini DevOps platform on Amazon Web Services (AWS) in the `ap-south-1` (Mumbai) region.

> [!CAUTION]
> **Billable Resources Warning**: Running `terraform apply` on this configuration will create real, billable AWS infrastructure (EKS Control Plane, EC2 NAT Gateway, EC2 Managed Node Group instances, Elastic IPs, KMS Customer Managed Key, and CloudWatch Log Groups). Always run `terraform plan` first to review planned resources. When decommissioning, execute `terraform destroy` to prevent recurring cloud charges.

---

## 1. Architecture Overview

The infrastructure follows the AWS Well-Architected Framework and EKS Best Practices:
* **Multi-AZ VPC**: High-availability networking across multiple Availability Zones (`ap-south-1a`, `ap-south-1b`).
* **Subnet Isolation**:
  * **Public Subnets**: Host the Internet Gateway and NAT Gateway. Tagged with `kubernetes.io/role/elb = 1` for public Application Load Balancers.
  * **Private Subnets**: House all EKS worker nodes and application workloads. Tagged with `kubernetes.io/role/internal-elb = 1` for internal routing.
* **Cost-Controlled Outbound Connectivity**: Single NAT Gateway deployment option minimizes hourly charges (~$32/month per NAT GW saved) while ensuring private worker nodes can reach ECR, GitHub, and external APIs.
* **Amazon EKS Managed Control Plane**: Kubernetes v1.30 with control-plane logging enabled for `api`, `audit`, `authenticator`, `controllerManager`, and `scheduler`.
* **KMS Secrets Envelope Encryption**: Dedicated AWS KMS Customer Managed Key (CMK) with automatic annual key rotation for hardware-backed Kubernetes Secret encryption.
* **Managed Node Group**: Scalable EC2 worker node pool placed exclusively in private subnets with least-privilege IAM instance profiles and containerd runtime.
* **IAM Roles for Service Accounts (IRSA)**: EKS OIDC identity provider enabling fine-grained, pod-level AWS IAM authentication without persistent EC2 credentials.

---

## 2. Directory Structure

```text
infrastructure/
├── main.tf                      # Root module wiring VPC, Security, IAM, and EKS
├── variables.tf                 # Input variable declarations with defaults
├── outputs.tf                   # Exposed endpoints, ARNs, and connection commands
├── versions.tf                  # Terraform (>= 1.5.0) and AWS Provider (>= 5.0) constraints
├── terraform.tfvars.example     # Non-sensitive configuration example template
├── README.md                    # Infrastructure runbook and architecture documentation
└── modules/
    ├── vpc/                     # Custom VPC, multi-AZ subnets, IGW, NAT GW, route tables
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security/                # Cluster and Node security groups and traffic rules
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── iam/                     # EKS cluster role, node role, and KMS key for secrets
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── eks/                     # EKS cluster, managed node group, CloudWatch logs, OIDC
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

---

## 3. Networking Design

| Subnet Type | Availability Zone | CIDR Block | Purpose | Kubernetes Tag |
| :--- | :--- | :--- | :--- | :--- |
| **Public A** | `ap-south-1a` | `10.0.1.0/24` | Ingress ALBs, NAT Gateway | `kubernetes.io/role/elb: 1` |
| **Public B** | `ap-south-1b` | `10.0.2.0/24` | Ingress ALBs | `kubernetes.io/role/elb: 1` |
| **Private A** | `ap-south-1a` | `10.0.10.0/24` | EKS Worker Nodes, Pods | `kubernetes.io/role/internal-elb: 1` |
| **Private B** | `ap-south-1b` | `10.0.20.0/24` | EKS Worker Nodes, Pods | `kubernetes.io/role/internal-elb: 1` |

---

## 4. Security Model & Defense in Depth

1. **Private Worker Nodes**: Worker nodes possess no public IPv4 addresses and can only communicate through the NAT Gateway.
2. **Cluster Security Group**: Only allows HTTPS (port 443) traffic originating from worker nodes and authorized CIDRs.
3. **Node Security Group**: Allows intra-cluster pod communication (all ports across self), kubelet health checks (port 10250) from the control plane, and HTTPS (port 443).
4. **Least-Privilege IAM**:
   * EKS Cluster Role: Limited to `AmazonEKSClusterPolicy` and `AmazonEKSVPCResourceController`.
   * Node Group Role: Limited to `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`.
5. **Hardware Envelope Encryption**: AWS KMS customer-managed key encrypts all Kubernetes `v1/secrets` at rest before persisting in etcd.
6. **Audit & Compliance Logging**: All control-plane audit, authenticator, and API server logs are forwarded to AWS CloudWatch Logs with 30-day retention.

---

## 5. Deployment Commands & Runbook

### Step 1: Initialize Terraform
Downloads the required HashiCorp AWS and TLS provider plugins and configures module dependencies:
```bash
terraform init
```

### Step 2: Format & Validate Code
Verifies that all HCL configuration syntax complies with canonical formatting and type validation:
```bash
terraform fmt -check -recursive
terraform validate
```

### Step 3: Plan Infrastructure (Dry Run)
Creates an execution plan showing exactly which resources will be provisioned without making any changes:
```bash
cp terraform.tfvars.example terraform.tfvars
terraform plan
```

### Step 4: Provision Infrastructure (When Approved)
Applies the planned configuration to create the AWS resources:
```bash
terraform apply
```

### Step 5: Connect Local Kubectl
After deployment, configure local `kubectl` to access the EKS cluster:
```bash
aws eks update-kubeconfig --region ap-south-1 --name advanced-gemini-devops-production
kubectl get nodes -o wide
```

### Step 6: Teardown / Decommission
To cleanly destroy all provisioned infrastructure when testing is complete:
```bash
terraform destroy
```

---

## 6. Estimated Cost Breakdown (ap-south-1)

| AWS Resource | Specification | Estimated Monthly Cost | Notes |
| :--- | :--- | :--- | :--- |
| **EKS Control Plane** | 1 Managed Cluster | ~$73.00 / month | $0.10/hour fixed AWS fee |
| **EC2 Worker Nodes** | 2 x `t3.medium` (4 vCPU, 8 GB total) | ~$61.00 / month | $0.0416/hour per instance |
| **EC2 Worker Nodes** | 2 x `c7i-flex.large` (4 vCPU, 8 GB total) | Free Tier eligible / promotional | Free Tier eligible in ap-south-1 |
| **NAT Gateway** | 1 Single NAT Gateway | ~$32.85 / month + data transfer | $0.045/hour + $0.045/GB processed |
| **EBS Storage** | 2 x 20 GB gp3 root volumes | ~$3.20 / month | $0.08/GB-month |
| **KMS CMK** | 1 Customer Managed Key | ~$1.00 / month | $1.00/key/month + API requests |
| **CloudWatch Logs** | EKS Control Plane logs (~5 GB/mo) | ~$2.50 / month | Ingestion & storage |
| **Total Estimated Cost** | — | **~$173.55 / month** | *Can be scaled to 0 nodes / destroyed when idle* |

