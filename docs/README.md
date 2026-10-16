# Financial Document Intelligence & RAG Analytics Platform
### Graph-Native Financial Intelligence Powered by FalkorDB & Next.js 15

Welcome to the documentation suite for the **Financial Document Intelligence & RAG Analytics Platform (FinDoc)**, engineered for **Graph Hacks: Context for AI Agents (Powered by FalkorDB)**.

---

## 👥 Core Engineering Team
- **Tejas Rawool** ([docs/dev/tejas.md](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/dev/tejas.md)) — *Full-Stack Next.js 15 Architect, DevOps & System Integration*
- **Samar Shetye** ([docs/dev/samar.md](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/dev/samar.md)) — *AI, Knowledge Graph Lead & Quantitative Financial Engine*

For implementation workflows and allocation, see the [Team Development Plan](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/dev/TEAM_DEVELOPMENT_PLAN.md).

---

## 📁 Documentation Map

| Category | Document | Description |
| :--- | :--- | :--- |
| **Architecture** | [`SYSTEM_DESIGN.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/SYSTEM_DESIGN.md) | High-level system architecture, service mesh, and data flows |
| **API Reference** | [`API.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/API.md) | FastAPI REST API endpoints, schemas, and FalkorDB graph routes |
| **Database** | [`DATABASE.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/DATABASE.md) | PostgreSQL 16 schema, pgvector indexing, and FalkorDB graph topology |
| **Next.js Frontend** | [`NEXTJS_FRONTEND_MIGRATION_PLAN.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/NEXTJS_FRONTEND_MIGRATION_PLAN.md) | Enterprise Next.js 15 App Router architecture and UI components |
| **Security & DevSecOps** | [`SECURITY.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/SECURITY.md) | Zero-trust input sanitization, JWT auth, and CORS policy |
| **DevOps & Deploy** | [`DEPLOYMENT.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/DEPLOYMENT.md) | Docker Compose container orchestration, healthchecks, and environment variables |
| **Requirements** | [`SRS.md`](file:///d:/Financial-Document-Intelligence-RAG-Analytics-Platform/docs/SRS.md) | Software Requirements Specification and functional requirements |

---

## ⚡ Quick Start

```powershell
# 1. Start all containerized services (FastAPI, Next.js, PostgreSQL, FalkorDB)
docker compose up -d

# 2. Seed the FalkorDB Corporate Knowledge Graph
npm run seed:falkor

# 3. Access web application
# Frontend: http://localhost:3000
# Knowledge Graph Explorer: http://localhost:3000/graph
# API Docs: http://localhost:8000/docs
```
