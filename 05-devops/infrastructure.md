---
Title: MeetingMind — DevOps: Infrastructure Architecture
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind DevOps: Infrastructure Architecture

## 1. Overview
This document outlines the cloud infrastructure required to run MeetingMind in a production environment. The architecture is designed for high availability, scalable AI processing, and secure data isolation.

## 2. Cloud Provider
**Primary Target:** AWS (Amazon Web Services). 
*(Note: Can be adapted for GCP or Azure, but AWS services are referenced for clarity).*

## 3. Core Components

### 3.1 Networking (VPC)
* **Public Subnets:** Contains Application Load Balancers (ALB) and NAT Gateways.
* **Private Subnets:** Contains the FastAPI Application Servers, Celery Workers, Database, and Redis cache. No direct internet access.

### 3.2 Application Servers (Frontend & API)
* **Frontend:** Vercel (recommended for Next.js) or AWS Amplify. If self-hosting entirely, ECS Fargate containers behind the ALB.
* **Backend API (FastAPI):** ECS Fargate (Serverless Containers). Autoscales based on CPU/Memory and HTTP request volume.

### 3.3 The AI Worker Pool (Celery)
This is the most complex part of the infrastructure, as it requires mixed compute types.
* **CPU Worker Group (ECS Fargate):** Handles lightweight tasks like webhook dispatching, sending emails, and API routing. Autoscales based on Redis queue depth.
* **GPU Worker Group (EC2 / EKS):** Handles Whisper transcription and Pyannote diarization. Fargate does not support GPUs. Requires an EC2 Auto Scaling Group using instances like `g4dn.xlarge` (NVIDIA T4). Scales up based on the specific `gpu_tasks` queue depth, and scales down to 0 when idle to save costs.

### 3.4 Data Persistence
* **Relational/Vector DB:** Amazon RDS for PostgreSQL. Must use an instance type that supports the `pgvector` extension. Recommended: Multi-AZ deployment for high availability.
* **Cache/Broker:** Amazon ElastiCache for Redis. Serves as the Celery message broker and application cache.
* **Object Storage:** Amazon S3. 
  * `meetingmind-uploads-prod`: Stores raw media.
  * Configured with lifecycle rules (e.g., transition to Glacier after 30 days).

## 4. Architecture Diagram (Conceptual)

```text
[ User / Browser ]
       │
       ▼
[ Cloudflare / WAF ]
       │
   ┌───┴─────────────┐
   │                 │
[ Vercel (Next.js) ] [ AWS ALB ]
                     │
         ┌───────────┴───────────┐
         │                       │
 [ FastAPI (Fargate) ]   [ Celery (Fargate/CPU) ]
         │                       │
         ├───────────────────────┤
         │                       │
 [ RDS Postgres ]        [ Redis Broker ]
   (pgvector)                    │
                                 │
                     [ Celery (EC2/GPU) ] <--> [ S3 ]
                                 │
                     [ External LLM APIs ]
```

## 5. Security & Compliance
* **WAF:** AWS WAF or Cloudflare deployed in front of the API to block DDoS, SQLi, and common exploits.
* **Encryption at Rest:** KMS keys used for RDS, S3, and ElastiCache.
* **Encryption in Transit:** TLS 1.3 enforced on ALB and Vercel. Internal traffic between ECS and RDS also uses TLS.
* **IAM:** Strict Least-Privilege IAM roles for ECS tasks (e.g., the API task can generate S3 Presigned URLs, but cannot delete objects. The Celery task can read/write objects, but only in specific buckets).

## 6. Self-Hosted / Open-Source Deployment
For users wanting to run MeetingMind entirely on-premise (often required for strict data privacy):
* The entire stack (Next.js, FastAPI, Postgres, Redis, Celery, Ollama) is orchestrated via a single `docker-compose.yml`.
* MinIO is used as a drop-in, S3-compatible replacement for object storage.
* Requires a local machine with a capable NVIDIA GPU and CUDA drivers installed for the Whisper/Ollama containers.
