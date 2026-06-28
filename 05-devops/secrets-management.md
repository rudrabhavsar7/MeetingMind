---
Title: MeetingMind — DevOps: Secrets Management
Version: 1.0.0
Status: Approved
Owner: Lead Security Engineer
Last Updated: 2026-06-28
Dependencies: 05-devops/environments.md
---

# MeetingMind DevOps: Secrets Management

## 1. Overview
MeetingMind handles sensitive API keys (OpenAI, SendGrid), database credentials, and JWT signing keys. These must never be hardcoded or checked into version control.

## 2. Core Rule
**No `.env` files containing production secrets are ever committed to the Git repository.**

## 3. Secret Storage Provider
* **AWS Systems Manager Parameter Store (SSM)** or **AWS Secrets Manager**.
* (Alternatively: HashiCorp Vault for self-hosted enterprise setups).

## 4. Injecting Secrets at Runtime
Docker containers should not have secrets baked into the image. Secrets are injected as Environment Variables when the container starts.

### In AWS ECS:
Define the secrets in the Task Definition. ECS will fetch them from SSM Parameter Store securely at boot and inject them.
```json
"secrets": [
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/meetingmind/prod/DATABASE_URL"
  },
  {
    "name": "OPENAI_API_KEY",
    "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/meetingmind/prod/OPENAI_API_KEY"
  }
]
```

## 5. Local Development
For local development, developers use a local `.env` file (which is in `.gitignore`).
* A `.env.example` file is committed to the repo, containing dummy values, so developers know which keys are required.
```text
# .env.example
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/meetingmind
JWT_SECRET_KEY=generate_a_random_string_here
OPENAI_API_KEY=sk-your-key-here
```

## 6. Secret Rotation
* **Database Passwords:** Should be rotated every 90 days. Update the RDS password, then update the SSM Parameter Store. ECS tasks will pick up the new password on their next deployment.
* **JWT Secret:** Rotating the JWT Secret will instantly log out all users across the platform (as their existing access tokens will fail signature validation). Do this only if a compromise is suspected.

## 7. Next.js Secrets (Frontend)
Next.js distinguishes between server-side secrets and client-side public variables.
* Variables prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_API_URL`) are embedded in the client-side JavaScript bundle. **Never put secrets in these.**
* Variables without the prefix (e.g., `GOOGLE_CLIENT_SECRET`) are only accessible in Next.js Server Actions or API routes.

In Vercel, manage these securely via the Vercel Dashboard Settings -> Environment Variables, scoped to Development, Preview, or Production.
