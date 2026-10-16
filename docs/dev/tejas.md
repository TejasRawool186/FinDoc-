# Developer 4: Micro-Module Technical Roadmap & Implementation Guide

**Role**: DevOps, Platform & Security Lead (Tejas)  
**Domain**: Multi-Stage Docker Containerization, Docker Compose Orchestration, GitHub Actions CI/CD Automation, Zero-Trust API Gateway Security, Rate Limiting, Prompt Injection Defenses, Prometheus/Grafana Telemetry, Celery/Redis Async Tasks, and Disaster Recovery Tooling  
**Architecture Principle**: Every module contains strictly one or at most two laser-focused technical tasks.  
**Execution Target**: 4 Sprints (8 Weeks standard / 4 Weeks accelerated)  

---

## 1. Developer 4 Micro-Module Topology

The DevOps, Security, and Platform infrastructure is divided into **8 sequential phases** containing **26 micro-modules**. Every micro-module has a single target file, precise interfaces/configs, and at most two atomic technical tasks.

```
+---------------------------------------------------------------------------------------+
| PHASE 1: REPOSITORY GOVERNANCE & DEVELOPER FOUNDATION                                 |
|  Module 1.1: Pre-Commit Quality Hooks & Linter Setup     (.pre-commit-config.yaml)    |
|  Module 1.2: Environment Settings & Pydantic Validator   (app/core/config.py)         |
|  Module 1.3: Structured JSON Logging & Correlation Trace (app/core/logging.py)        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 2: MULTI-STAGE CONTAINERIZATION & COMPOSE MESH                                  |
|  Module 2.1: Multi-Stage FastAPI Container Engine        (docker/Dockerfile.api)      |
|  Module 2.2: Multi-Stage Next.js 15 UI Container Engine  (docker/Dockerfile.next)     |
|  Module 2.3: Development Docker Compose Orchestrator     (docker-compose.yml)         |
|  Module 2.4: Production Hardened Compose Orchestrator    (docker-compose.prod.yml)    |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 3: AUTOMATED CI/CD PIPELINES (GITHUB ACTIONS)                                   |
|  Module 3.1: Static Analysis & Code Quality Pipeline     (.github/workflows/lint.yml) |
|  Module 3.2: Automated Pytest & Service Container Matrix (.github/workflows/test.yml) |
|  Module 3.3: Container Vulnerability & Trivy Scanner     (.github/workflows/sec.yml)  |
|  Module 3.4: Automated Tagging & Semantic Release Action (.github/workflows/rel.yml)  |
+---------------------------------------------------------------------------------------+
                                           |
                       +-------------------+-------------------+
                       |                                       |
                       v                                       v
+-------------------------------------------+ +-----------------------------------------+
| PHASE 4: ZERO-TRUST API SECURITY LAYER    | | PHASE 5: RATE LIMITING & TRAFFIC SHAPING|
|  Module 4.1: Magic-Byte & File Sanitizer  | |  Module 5.1: Redis/Memory Token Bucket  |
|  Module 4.2: Path Traversal & Shell Guard | |  Module 5.2: Client IP & Proxy Resolver |
|  Module 4.3: Indirect Prompt Injection Del| +-----------------------------------------+
|  Module 4.4: CORS & Security HTTP Headers |                          |
+-------------------------------------------+                          |
                       |                                               |
                       +-------------------+---------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 6: TELEMETRY, OBSERVABILITY & HEALTH PROBES                                     |
|  Module 6.1: Deep Health Check & Dependency Diagnostics  (app/api/health.py)          |
|  Module 6.2: Prometheus FastAPI Metrics Instrumentator   (app/core/metrics.py)        |
|  Module 6.3: Prometheus Scrape Daemon & Rule Config      (docker/monitoring/prom.yml) |
|  Module 6.4: Grafana Telemetry Dashboard Definition     (docker/monitoring/grafana)  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 7: ASYNCHRONOUS BACKGROUND WORKERS (CELERY + REDIS)                             |
|  Module 7.1: Celery Instance & Redis Broker Wire         (app/core/celery_app.py)     |
|  Module 7.2: Async Document Task Worker & State Tracker  (app/core/tasks.py)          |
|  Module 7.3: Celery Dedicated Worker Container Engine    (docker/Dockerfile.worker)   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 8: OPERATIONS, READINESS PROBES & DISASTER RECOVERY                             |
|  Module 8.1: PostgreSQL Availability Probe & Wait Hook   (scripts/wait_for_db.py)     |
|  Module 8.2: Automated Database Seeding & Mock Fixtures  (scripts/seed_database.py)   |
|  Module 8.3: Automated Backup & Snapshot Recovery Script (scripts/backup_restore.sh)  |
|  Module 8.4: Production Verification & Smoke Test Runner (scripts/verify_deploy.py)   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Micro-Module Technical Specifications

---

### Phase 1: Repository Governance & Developer Foundation

#### Module 1.1: Pre-Commit Quality Hooks & Linter Setup
* **Target File**: `.pre-commit-config.yaml` & `pyproject.toml`
* **Dependencies**: `pre-commit`, `black`, `ruff`, `mypy`
* **Sprint**: Sprint 1 (Day 1)

##### Technical Tasks (Max 2)
1. **Task 1 (Git Hooks Configuration)**: Create `.pre-commit-config.yaml` specifying `black`, `ruff` (linter and import sorter), `mypy`, and standard Git hygiene hooks (trailing whitespace, EOF fixing, large file blocking).
2. **Task 2 (Unified Tooling Config)**: Author `pyproject.toml` establishing standard code formatting constraints (line length 100, target Python 3.11) and Mypy strict typing rules across `app/`.

##### Signatures & Contracts
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=51200'] # 50MB PDF limit

  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic, types-requests]
        args: [--ignore-missing-imports, --config-file=pyproject.toml]
```

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'

[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "W", "I", "N", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
ignore_missing_imports = true
```
* **DoD**: Running `pre-commit run --all-files` validates all repo files without errors and auto-formats non-compliant files.

---

#### Module 1.2: Environment Settings & Pydantic Validator
* **Target File**: `app/core/config.py`
* **Dependencies**: `pydantic-settings`, `pydantic`
* **Sprint**: Sprint 1 (Day 1)

##### Technical Tasks (Max 2)
1. **Task 1 (Settings Model Architecture)**: Define a strictly-typed `Settings` class using `BaseSettings` reading environment variables for PostgreSQL, pgvector, Redis, OpenAI, Ollama, API ports, and CORS origins.
2. **Task 2 (Fail-Fast Validation & Defaults)**: Enforce boundary validation (e.g. database URL format, positive timeouts, valid log levels) and emit clear configuration error messages if required variables are missing.

##### Signatures & Contracts
```python
# app/core/config.py
from typing import List, Optional
from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Project metadata
    PROJECT_NAME: str = "Financial Document Intelligence Platform"
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production|test)$")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/financial_rag")
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT_SECONDS: int = 30

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # AI & Embedding Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3:8b"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Application Limits & Paths
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024 # 50 MB
    UPLOAD_DIR: str = "data/uploads"
    ALLOWED_CORS_ORIGINS: List[str] = ["http://localhost:8501", "http://localhost:3000"]

    # Security
    RATE_LIMIT_PER_MINUTE: int = 60
    JWT_SECRET_KEY: str = Field(default="CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_123456789")

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        if not v.startswith(("postgresql://", "postgresql+psycopg2://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL connection URI")
        return v

settings = Settings()
```
* **DoD**: Unit test instantiates `Settings` with defaults, verifies `.env` override, and fails fast when invalid parameters are supplied.

---

#### Module 1.3: Structured JSON Logging & Correlation Trace
* **Target File**: `app/core/logging.py`
* **Dependencies**: `logging`, `json`, `uuid`, `starlette`
* **Sprint**: Sprint 1 (Day 2)

##### Technical Tasks (Max 2)
1. **Task 1 (JSON Formatter Engine)**: Implement `StructuredJSONFormatter` outputting ISO 8601 timestamps, log levels, module names, function identifiers, correlation IDs, and arbitrary contextual dictionaries.
2. **Task 2 (Correlation ID Middleware)**: Implement FastAPI middleware injecting `X-Correlation-ID` header into incoming requests, setting contextvar for logger tracing, and attaching it to all downstream log records.

##### Signatures & Contracts
```python
# app/core/logging.py
import json
import logging
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")

class StructuredJSONFormatter(logging.Formatter):
    """Outputs production structured logs in JSON format for Grafana / Loki ingestion."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
            "correlation_id": correlation_id_ctx.get() or getattr(record, "correlation_id", None),
        }
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_obj.update(record.extra)
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Ensures every HTTP request has a trace correlation ID across services."""
    async def dispatch(self, request: Request, call_next) -> Response:
        cid = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        token = correlation_id_ctx.set(cid)
        try:
            response: Response = await call_next(request)
            response.headers["X-Correlation-ID"] = cid
            return response
        finally:
            correlation_id_ctx.reset(token)

def configure_logging(log_level: str = "INFO") -> None:
    """Configures root logger with JSON formatter for stdout."""
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredJSONFormatter())
    logging.root.setLevel(log_level.upper())
    logging.root.handlers = [handler]
```
* **DoD**: Every log line generated inside API endpoints outputs valid JSON string containing `timestamp`, `level`, `message`, and `correlation_id`.

---

### Phase 2: Multi-Stage Containerization & Compose Mesh

#### Module 2.1: Multi-Stage FastAPI Container Engine
* **Target File**: `docker/Dockerfile.api`
* **Dependencies**: `python:3.11-slim`, `gcc`, `libpq-dev`
* **Sprint**: Sprint 1 (Day 3)

##### Technical Tasks (Max 2)
1. **Task 1 (Build Stage Compilation)**: Create intermediate builder container installing compile dependencies (`gcc`, `libpq-dev`), wheels, and runtime dependencies.
2. **Task 2 (Hardened Runtime Image)**: Copy pre-built wheels into clean `python:3.11-slim` runner, create non-root `appuser` (UID 10001), declare health check, and define default Uvicorn entrypoint on port 8000.

##### Signatures & Contracts
```dockerfile
# docker/Dockerfile.api
# Stage 1: Build Dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Final Minimal Runtime
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create and switch to non-root user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy installed packages from builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy application code
COPY --chown=appuser:appgroup . /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
* **DoD**: `docker build -t financial-api -f docker/Dockerfile.api .` succeeds; image size is < 400MB; container executes under non-root UID 10001.

---

#### Module 2.2: Multi-Stage Next.js 15 UI Container Engine
* **Target File**: `docker/Dockerfile.next`
* **Dependencies**: `node:20-alpine`, `npm`
* **Sprint**: Sprint 1 (Day 3)

##### Technical Tasks (Max 2)
1. **Task 1 (Next.js Dependency & Standalone Build)**: Author multi-stage build running `npm install` and `npm run build` with Turbopack, emitting standalone production artifacts.
2. **Task 2 (Next.js Runner & Non-Root Execution)**: Configure production runner image with non-root `nextjs` user, port 3000, and optimized static asset serving.

##### Signatures & Contracts
```dockerfile
# docker/Dockerfile.next
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY frontend-next/package.json frontend-next/package-lock.json* ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend-next ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```
* **DoD**: Container builds successfully; runs on port 3000; responds 200 OK on `/`.

---

#### Module 2.3: Development Docker Compose Orchestrator
* **Target File**: `docker-compose.yml`
* **Dependencies**: `postgres:15-alpine`, `redis:7-alpine`, `api`, `frontend`
* **Sprint**: Sprint 1 (Day 4)

##### Technical Tasks (Max 2)
1. **Task 1 (Multi-Service Wire & Networks)**: Construct Compose specification linking PostgreSQL 16 with pgvector extension, FalkorDB graph engine, FastAPI backend, and Next.js 15 frontend over an isolated bridge network `fdi-network`.
2. **Task 2 (Healthcheck Dependency Chains & Volume Mounts)**: Configure healthcheck probes so `api` waits for `postgres` to be healthy, mount local directories for hot-reloading in development, and persist database storage in named volume `postgres_data`.

##### Signatures & Contracts
```yaml
# docker-compose.yml
version: "3.8"

networks:
  financial-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  upload_data:

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: financial_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-financial_rag}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - financial-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-financial_rag}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: financial_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - financial-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    container_name: financial_api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/financial_rag
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - UPLOAD_DIR=/app/data/uploads
    volumes:
      - ./app:/app/app:ro
      - upload_data:/app/data/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - financial-net

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    container_name: financial_frontend
    restart: unless-stopped
    ports:
      - "8501:8501"
    environment:
      - API_BASE_URL=http://api:8000
    volumes:
      - ./frontend:/app/frontend:ro
    depends_on:
      - api
    networks:
      - financial-net
```
* **DoD**: Executing `docker compose up -d` boots all 4 containers in sequence; all health checks pass with `(healthy)` status.

---

#### Module 2.4: Production Hardened Compose Orchestrator
* **Target File**: `docker-compose.prod.yml`
* **Dependencies**: `docker/Dockerfile.api`, `docker/Dockerfile.frontend`
* **Sprint**: Sprint 3 (Day 13)

##### Technical Tasks (Max 2)
1. **Task 1 (Resource Limits & Security Constraints)**: Configure memory and CPU quotas (`mem_limit: 1g`, `cpus: 1.5`), disable debug mode, drop root capabilities, and enforce `read_only` root filesystems where applicable.
2. **Task 2 (Restart Policies & Network Segregation)**: Apply `restart: always`, isolate database and Redis into internal private backend network without public host port bindings, exposing only API and frontend ingress.

##### Signatures & Contracts
```yaml
# docker-compose.prod.yml
version: "3.8"

networks:
  frontend-tier:
    driver: bridge
  backend-tier:
    internal: true

services:
  postgres:
    image: pgvector/pgvector:pg15
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2048M
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - backend-tier
    # No exposed host ports for database in production

  redis:
    image: redis:7-alpine
    restart: always
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    networks:
      - backend-tier

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2.0'
          memory: 2048M
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=False
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    networks:
      - frontend-tier
      - backend-tier

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M
    ports:
      - "8501:8501"
    environment:
      - API_BASE_URL=http://api:8000
    networks:
      - frontend-tier
```
* **DoD**: Production compose starts without warnings, enforces CPU/memory boundaries, and prevents host access to port 5432 and 6379.

---

### Phase 3: Automated CI/CD Pipelines (GitHub Actions)

#### Module 3.1: Static Analysis & Code Quality Pipeline
* **Target File**: `.github/workflows/lint.yml`
* **Dependencies**: `github-actions`, `ruff`, `black`, `mypy`
* **Sprint**: Sprint 1 (Day 4)

##### Technical Tasks (Max 2)
1. **Task 1 (Automated Formatting Validation)**: Trigger on every push and PR to `main` and `develop`, running Black `--check` and Ruff checks across all Python source modules.
2. **Task 2 (Strict Mypy Type Enforcement)**: Run Mypy static type verification on `app/` and fail pipeline immediately if unresolved type errors are introduced.

##### Signatures & Contracts
```yaml
# .github/workflows/lint.yml
name: Lint & Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  static-analysis:
    name: Code Style & Type Checking
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install Quality Tools
        run: pip install ruff black mypy pydantic pydantic-settings types-requests

      - name: Verify Black Code Formatting
        run: black --check app/ tests/ frontend/

      - name: Execute Ruff Linter
        run: ruff check app/ tests/ frontend/

      - name: Execute Mypy Static Type Verification
        run: mypy app/ --config-file=pyproject.toml
```
* **DoD**: Workflow executes in < 60 seconds on GitHub Actions and reports green checkmark on clean PRs.

---

#### Module 3.2: Automated Pytest & Service Container Matrix
* **Target File**: `.github/workflows/test.yml`
* **Dependencies**: `pytest`, `pytest-cov`, `pgvector/pgvector:pg15`, `redis:7-alpine`
* **Sprint**: Sprint 2 (Day 8)

##### Technical Tasks (Max 2)
1. **Task 1 (Ephemeral Database & Redis Service Containers)**: Instantiate real PostgreSQL (with pgvector) and Redis service containers inside GitHub Actions runner environment with automated healthcheck probes.
2. **Task 2 (Pytest Execution & Minimum Coverage Gate)**: Run unit and integration tests with coverage reporting, asserting that test coverage meets or exceeds the required threshold (>= 85%).

##### Signatures & Contracts
```yaml
# .github/workflows/test.yml
name: Automated Testing & Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  integration-tests:
    name: Pytest with Postgres & Redis Services
    runs-on: ubuntu-latest

    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_financial_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install Runtime & Test Dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio httpx

      - name: Execute Pytest Suite with Coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_financial_db
          REDIS_URL: redis://localhost:6379/0
          ENVIRONMENT: test
          OPENAI_API_KEY: sk-mock-key-for-testing-purposes
        run: |
          pytest --cov=app --cov-report=xml --cov-report=term-missing --cov-fail-under=85 tests/

      - name: Store Coverage Artifact
        uses: actions/upload-artifact@v4
        with:
          name: code-coverage-report
          path: coverage.xml
```
* **DoD**: Automated CI runs all Pytest suites against real PostgreSQL/Redis instances and fails if coverage drops below 85%.

---

#### Module 3.3: Container Vulnerability & Trivy Scanner
* **Target File**: `.github/workflows/security.yml`
* **Dependencies**: `aquasecurity/trivy-action`, `docker`
* **Sprint**: Sprint 4 (Day 16)

##### Technical Tasks (Max 2)
1. **Task 1 (Docker Build & Layer Cache)**: Build production `Dockerfile.api` and `Dockerfile.frontend` images inside GitHub Actions.
2. **Task 2 (Trivy Vulnerability & SBOM Audit)**: Scan both generated Docker images with Trivy; fail build if `CRITICAL` or `HIGH` Common Vulnerabilities and Exposures (CVEs) are detected.

##### Signatures & Contracts
```yaml
# .github/workflows/security.yml
name: Security & Container Scan

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly Sunday run
  pull_request:
    branches: [main]

jobs:
  vulnerability-scan:
    name: Trivy Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Build API Docker Image
        run: docker build -t local/financial-api:scan -f docker/Dockerfile.api .

      - name: Scan API Image for High/Critical CVEs
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'local/financial-api:scan'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'

      - name: Build Frontend Docker Image
        run: docker build -t local/financial-frontend:scan -f docker/Dockerfile.frontend .

      - name: Scan Frontend Image for High/Critical CVEs
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'local/financial-frontend:scan'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'
```
* **DoD**: Pipeline passes with 0 Critical/High unpatched vulnerabilities in API and frontend container images.

---

#### Module 3.4: Automated Tagging & Semantic Release Action
* **Target File**: `.github/workflows/release.yml`
* **Dependencies**: `actions/create-release`, `docker/build-push-action`
* **Sprint**: Sprint 4 (Day 18)

##### Technical Tasks (Max 2)
1. **Task 1 (Tag Trigger & Release Artifact Generator)**: Trigger on semantic tags (`v*.*.*`), compile automated release notes from commit history, and draft GitHub Release.
2. **Task 2 (Container Registry Publishing)**: Build and publish production Docker containers to GitHub Container Registry (`ghcr.io`) tagged with the semantic version and `latest`.

##### Signatures & Contracts
```yaml
# .github/workflows/release.yml
name: Release & Package Containers

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Metadata
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/api

      - name: Build and Push API Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.api
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```
* **DoD**: Tagging `v1.0.0` automatically triggers workflow, pushes multi-arch images to GHCR, and generates release notes.

---

### Phase 4: Zero-Trust API Security Layer

#### Module 4.1: Magic-Byte & File Upload Security Guard
* **Target File**: `app/core/file_security.py`
* **Dependencies**: `python-magic` or native header verification, `pydantic`
* **Sprint**: Sprint 2 (Day 6)

##### Technical Tasks (Max 2)
1. **Task 1 (Magic-Byte Inspection & File Spoofing Defense)**: Read raw binary stream headers and verify that byte 0-4 strictly equals `%PDF-`. Reject any file claiming `.pdf` extension whose binary signature is an executable (`MZ`), zip/archive (`PK`), or script.
2. **Task 2 (Payload Size Enforcement & Decompression Bomb Guard)**: Enforce an exact 50MB byte ceiling during streaming read and reject zero-byte files with error code `SEC_001`.

##### Signatures & Contracts
```python
# app/core/file_security.py
from typing import Tuple

PDF_MAGIC_BYTES = b"%PDF-"
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 # 50 Megabytes

class FileSecurityViolation(Exception):
    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(message)

class FileSecurityValidator:
    """Validates raw binary uploads to prevent file spoofing and malicious binaries."""

    @staticmethod
    def validate_file_buffer(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
        # 1. File Size Verification
        size = len(file_bytes)
        if size == 0:
            raise FileSecurityViolation("SEC_001", "Uploaded file is empty (0 bytes).")
        if size > MAX_FILE_SIZE_BYTES:
            raise FileSecurityViolation("SEC_002", f"File size ({size} bytes) exceeds 50MB limit.")

        # 2. Extension Check
        if not filename.lower().endswith(".pdf"):
            raise FileSecurityViolation("SEC_003", "Invalid file extension. Only .pdf permitted.")

        # 3. Magic-Byte Header Verification
        if not file_bytes.startswith(PDF_MAGIC_BYTES):
            # Check for common executable/malicious headers
            if file_bytes.startswith(b"MZ"):
                raise FileSecurityViolation("SEC_004", "Security alert: Executable binary detected.")
            if file_bytes.startswith(b"PK"):
                raise FileSecurityViolation("SEC_005", "Security alert: Compressed archive detected.")
            raise FileSecurityViolation("SEC_006", "File header does not match valid PDF magic bytes.")

        return True, "File passed all security verifications."
```
* **DoD**: Unit test rejects renamed `.exe`, `.zip`, `.sh` files and files > 50MB; passes legitimate PDFs.

---

#### Module 4.2: Input Sanitization & Path Traversal Neutralizer
* **Target File**: `app/core/sanitizer.py`
* **Dependencies**: `re`, `pathlib`, `html`
* **Sprint**: Sprint 2 (Day 6)

##### Technical Tasks (Max 2)
1. **Task 1 (Filename Sanitization & Path Traversal Block)**: Strip path separators (`../`, `..\`, `/`, `\`), null bytes (`\x00`), and non-alphanumeric characters from filenames, generating safe UUID-prefixed filenames.
2. **Task 2 (Text Input Cleansing)**: Sanitize user text queries, stripping hazardous HTML/script tags and control characters to prevent XSS and database storage corruption.

##### Signatures & Contracts
```python
# app/core/sanitizer.py
import html
import os
import re
import uuid
from pathlib import Path

class InputSanitizer:
    """Sanitizes user strings and filenames to prevent path traversal and XSS."""

    SAFE_FILENAME_REGEX = re.compile(r"[^a-zA-Z0-9_\-\.]")

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Strips directory traversal sequences and special characters."""
        # Remove null bytes and directory components
        cleaned = os.path.basename(filename.replace("\x00", ""))
        # Replace non-safe chars with underscore
        safe_name = cls.SAFE_FILENAME_REGEX.sub("_", cleaned)
        # Prevent hidden files
        safe_name = safe_name.lstrip(".")
        if not safe_name:
            safe_name = f"document_{uuid.uuid4().hex[:8]}.pdf"
        # Prepend unique UUID token to guarantee collision-free storage
        return f"{uuid.uuid4().hex[:12]}_{safe_name}"

    @staticmethod
    def sanitize_query_text(query: str) -> str:
        """Cleanses search queries and chat inputs."""
        if not query:
            return ""
        # Strip HTML tags
        clean_text = html.escape(query.strip())
        # Remove dangerous control characters while preserving unicode financial symbols
        clean_text = "".join(ch for ch in clean_text if ch.isprintable() or ch in "\n\r\t")
        return clean_text[:1000] # Hard upper bound of 1000 characters
```
* **DoD**: Path traversal attacks like `../../../../etc/passwd` are converted to safe basenames without exception.

---

#### Module 4.3: Indirect Prompt Injection Delimiter & Guardrails Engine
* **Target File**: `app/core/security.py`
* **Dependencies**: `re`, `pydantic`
* **Sprint**: Sprint 2 (Day 7)

##### Technical Tasks (Max 2)
1. **Task 1 (Regex Injection Pattern Detector)**: Scan incoming user queries and unverified document chunks for common jailbreak/override signatures (e.g. `Ignore previous instructions`, `System prompt override`, `You are now DAN`).
2. **Task 2 (Context Sandboxing Delimiter Injector)**: Encapsulate retrieved chunk content in strict `<context>` and `<retrieved_document>` XML delimiters with explicit instructions to the LLM treating enclosed text strictly as untrusted data.

##### Signatures & Contracts
```python
# app/core/security.py
import re
from typing import List, Tuple
from pydantic import BaseModel

class InjectionCheckResult(BaseModel):
    is_safe: bool
    detected_pattern: str = ""
    threat_level: str = "NONE" # NONE, SUSPICIOUS, HIGH

class PromptSecurityEngine:
    """Detects and neutralizes prompt injection attempts in financial document RAG."""

    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
        re.compile(r"system\s+prompt\s+override", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+(unfiltered|dan|an\s+ai\s+without\s+rules)", re.IGNORECASE),
        re.compile(r"reveal\s+(the\s+)?(system\s+prompt|api\s+key|database\s+credentials)", re.IGNORECASE),
        re.compile(r"<\s*/?\s*system\s*>", re.IGNORECASE),
    ]

    @classmethod
    def scan_for_injection(cls, text: str) -> InjectionCheckResult:
        """Scans user query or document chunk for known injection signatures."""
        for pattern in cls.INJECTION_PATTERNS:
            match = pattern.search(text)
            if match:
                return InjectionCheckResult(
                    is_safe=False,
                    detected_pattern=match.group(0),
                    threat_level="HIGH"
                )
        return InjectionCheckResult(is_safe=True)

    @staticmethod
    def wrap_in_sandboxed_delimiters(chunks: List[str]) -> str:
        """Sandboxes document chunks inside XML boundary tags to isolate data from instructions."""
        delimited_blocks = []
        for idx, chunk in enumerate(chunks, 1):
            clean_chunk = chunk.replace("<context>", "").replace("</context>", "")
            delimited_blocks.append(
                f'<document_chunk id="{idx}">\n{clean_chunk}\n</document_chunk>'
            )
        combined = "\n".join(delimited_blocks)
        return f"<context>\n{combined}\n</context>"
```
* **DoD**: Unit test asserts that all 5 known jailbreak patterns are detected and flagged `threat_level="HIGH"`.

---

#### Module 4.4: CORS & Security HTTP Headers Middleware
* **Target File**: `app/core/middleware.py`
* **Dependencies**: `starlette`, `fastapi`
* **Sprint**: Sprint 2 (Day 7)

##### Technical Tasks (Max 2)
1. **Task 1 (Security Headers Injection Middleware)**: Author ASGI middleware injecting modern browser security headers into every API response (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`).
2. **Task 2 (Explicit CORS Restriction)**: Configure FastAPI CORS middleware restricting allowed origins strictly to the Next.js frontend origin (`http://localhost:3000`), banning wildcard `*` origins in production.

##### Signatures & Contracts
```python
# app/core/middleware.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces enterprise security headers on all HTTP responses."""
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

def setup_security_middleware(app: FastAPI, allowed_origins: list[str]) -> None:
    """Registers CORS and Security Header middlewares onto the FastAPI application."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
```
* **DoD**: Curled endpoint responses contain all 6 security headers; CORS blocks unauthorized origins with HTTP 403/disallowed header.

---

### Phase 5: Rate Limiting & Traffic Management

#### Module 5.1: Redis/Memory Token Bucket Rate Limiter
* **Target File**: `app/core/rate_limit.py`
* **Dependencies**: `slowapi`, `redis`
* **Sprint**: Sprint 3 (Day 11)

##### Technical Tasks (Max 2)
1. **Task 1 (SlowAPI Limiter Initialization)**: Configure SlowAPI limiter utilizing Redis connection if available, with graceful fallback to in-memory storage for local offline testing.
2. **Task 2 (Endpoint Limit Decorators & 429 Handler)**: Establish tiered rate limits (e.g., 10 req/min for expensive `/query` and `/documents/upload`, 60 req/min for read-only GET routes) and standardized `RATE_LIMIT_EXCEEDED` JSON error responses.

##### Signatures & Contracts
```python
# app/core/rate_limit.py
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    storage_uri="redis://localhost:6379/0", # Fallbacks to memory if unreachable
    strategy="fixed-window"
)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Standardized error envelope on HTTP 429."""
    return JSONResponse(
        status_code=429,
        content={
            "error_code": "RATE_LIMIT_EXCEEDED",
            "message": f"Too many requests. Rate limit exceeded: {exc.detail}",
            "retry_after_seconds": 60
        },
        headers={"Retry-After": "60"}
    )
```
* **DoD**: Sending 11 rapid requests to `/query` returns HTTP 429 with `RATE_LIMIT_EXCEEDED` on the 11th call.

---

#### Module 5.2: Client IP & Proxy Resolver
* **Target File**: `app/core/ip_resolver.py`
* **Dependencies**: `starlette`
* **Sprint**: Sprint 3 (Day 11)

##### Technical Tasks (Max 2)
1. **Task 1 (X-Forwarded-For Sanitizer)**: Parse `X-Forwarded-For` and `X-Real-IP` headers accurately behind reverse proxies (Nginx/Traefik/Cloudflare), ignoring spoofed header entries.
2. **Task 2 (Trusted Proxy Filter)**: Enforce validation ensuring IP extraction only trusts header overrides originating from defined trusted proxy CIDR ranges.

##### Signatures & Contracts
```python
# app/core/ip_resolver.py
import ipaddress
from starlette.requests import Request

TRUSTED_PROXIES = [
    ipaddress.ip_network("127.0.0.1/32"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
]

def get_trusted_client_ip(request: Request) -> str:
    """Extracts true client IP, validating reverse proxy trust boundary."""
    client_host = request.client.host if request.client else "127.0.0.1"
    client_addr = ipaddress.ip_address(client_host)

    is_trusted = any(client_addr in network for network in TRUSTED_PROXIES)
    if is_trusted:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # First IP in comma-separated list is client IP
            first_ip = forwarded_for.split(",")[0].strip()
            return first_ip

    return client_host
```
* **DoD**: Correctly returns external client IP when request traverses trusted proxy, and ignores forged headers from untrusted clients.

---

### Phase 6: Telemetry, Observability & Health Probes

#### Module 6.1: Deep Health Check & Dependency Diagnostics
* **Target File**: `app/api/health.py`
* **Dependencies**: `fastapi`, `sqlalchemy`, `redis`, `httpx`
* **Sprint**: Sprint 2 (Day 8)

##### Technical Tasks (Max 2)
1. **Task 1 (Deep Probe Subsystem Checker)**: Implement `/health` route probing PostgreSQL connectivity (`SELECT 1`), Redis ping, and storage directory writeability in parallel.
2. **Task 2 (Degraded State Status Reporting)**: Return HTTP 200 with `status: "healthy"` when all services pass; return HTTP 503 with individual component degradation logs if any critical subsystem fails.

##### Signatures & Contracts
```python
# app/api/health.py
import time
from typing import Dict
from fastapi import APIRouter, Response, status
from pydantic import BaseModel
import redis
from sqlalchemy import text
from app.core.config import settings

router = APIRouter(tags=["System Health"])

class SubsystemStatus(BaseModel):
    status: str # "UP" or "DOWN"
    latency_ms: float
    details: str = ""

class HealthCheckDTO(BaseModel):
    overall_status: str # "healthy" or "degraded"
    uptime_seconds: float
    timestamp: float
    components: Dict[str, SubsystemStatus]

START_TIME = time.time()

@router.get("/health", response_model=HealthCheckDTO)
def deep_health_check(response: Response, db_session = None) -> HealthCheckDTO:
    """Executes live diagnostic probes against database, redis, and disk storage."""
    components: Dict[str, SubsystemStatus] = {}
    is_healthy = True

    # 1. Probe PostgreSQL
    t0 = time.perf_counter()
    try:
        # Probe DB if session available
        components["postgres"] = SubsystemStatus(
            status="UP",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2)
        )
    except Exception as e:
        components["postgres"] = SubsystemStatus(status="DOWN", latency_ms=0, details=str(e))
        is_healthy = False

    # 2. Probe Redis
    t0 = time.perf_counter()
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=1)
        r.ping()
        components["redis"] = SubsystemStatus(
            status="UP",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2)
        )
    except Exception as e:
        components["redis"] = SubsystemStatus(status="DOWN", latency_ms=0, details=str(e))
        is_healthy = False

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthCheckDTO(
        overall_status="healthy" if is_healthy else "degraded",
        uptime_seconds=round(time.time() - START_TIME, 1),
        timestamp=time.time(),
        components=components
    )
```
* **DoD**: Calling `/health` returns 200 with component latencies; returns 503 if PostgreSQL or Redis is stopped.

---

#### Module 6.2: Prometheus FastAPI Metrics Instrumentator
* **Target File**: `app/core/metrics.py`
* **Dependencies**: `prometheus-fastapi-instrumentator`, `prometheus-client`
* **Sprint**: Sprint 3 (Day 12)

##### Technical Tasks (Max 2)
1. **Task 1 (Instrumentation Integration)**: Attach Prometheus ASGI Instrumentator to FastAPI, exposing standard Prometheus scrape endpoint `/metrics`.
2. **Task 2 (Domain Custom Metric Gauges & Histograms)**: Define custom Prometheus metrics for document processing duration, RAG query latency histogram, and active Celery task counts.

##### Signatures & Contracts
```python
# app/core/metrics.py
from fastapi import FastAPI
from prometheus_client import Counter, Histogram
from prometheus_fastapi_instrumentator import Instrumentator

# Domain Specific Metrics
DOCUMENT_PROCESSING_SECONDS = Histogram(
    "financial_doc_processing_duration_seconds",
    "Time taken to parse, chunk, and embed financial documents",
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0]
)

RAG_QUERY_SECONDS = Histogram(
    "financial_rag_query_duration_seconds",
    "Latency of grounded RAG retrieval and generation",
    buckets=[0.2, 0.5, 1.0, 2.0, 5.0, 10.0]
)

LLM_TOKEN_USAGE_COUNTER = Counter(
    "financial_llm_tokens_total",
    "Total tokens consumed by LLM generation",
    ["model", "type"] # type: prompt or completion
)

def setup_prometheus_metrics(app: FastAPI) -> None:
    """Instruments FastAPI application with /metrics endpoint."""
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        excluded_handlers=["/health", "/metrics"]
    ).instrument(app).expose(app, endpoint="/metrics")
```
* **DoD**: Visiting `/metrics` outputs Prometheus-formatted telemetry including custom financial latency histograms.

---

#### Module 6.3: Prometheus Scrape Daemon & Rule Config
* **Target File**: `docker/monitoring/prometheus.yml`
* **Dependencies**: `prom/prometheus:v2.51.0`
* **Sprint**: Sprint 3 (Day 12)

##### Technical Tasks (Max 2)
1. **Task 1 (Scrape Job Architecture)**: Define Prometheus scrape targets for `financial_api` (interval: 5s) and `node_exporter` (interval: 15s).
2. **Task 2 (Alerting Threshold Rules)**: Author alerting rules detecting high error rates (> 5% HTTP 5xx over 5 minutes) and API latency degradation (> 2s for p95 over 5 minutes).

##### Signatures & Contracts
```yaml
# docker/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: "financial-api"
    metrics_path: "/metrics"
    scrape_interval: 5s
    static_configs:
      - targets: ["api:8000"]

  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

```yaml
# docker/monitoring/alert_rules.yml
groups:
  - name: financial_platform_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API Error rate exceeds 5%"

      - alert: SlowRAGQueries
        expr: histogram_quantile(0.95, rate(financial_rag_query_duration_seconds_bucket[5m])) > 3.0
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile RAG query latency > 3 seconds"
```
* **DoD**: Prometheus container starts up, discovers target `api:8000`, and enters `UP` state in scrape targets table.

---

#### Module 6.4: Grafana Operational Dashboard Definition
* **Target File**: `docker/monitoring/grafana/dashboards/platform_overview.json`
* **Dependencies**: `grafana/grafana:10.4.2`
* **Sprint**: Sprint 4 (Day 15)

##### Technical Tasks (Max 2)
1. **Task 1 (Datasource Provisioning Config)**: Author `datasources.yml` auto-connecting Grafana to Prometheus service on port 9090 without manual UI configuration.
2. **Task 2 (Executive Telemetry Dashboard JSON)**: Build Grafana dashboard JSON containing 6 visualization panels: Request Rate (RPS), p95 Latency, Error Rate (4xx/5xx), Active Ingestion Tasks, LLM Token Burn, and Memory Usage.

##### Signatures & Contracts
```yaml
# docker/monitoring/grafana/provisioning/datasources/datasource.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```
* **DoD**: Running Grafana container automatically displays pre-configured dashboard displaying live request rate and p95 latency graphs.

---

### Phase 7: Asynchronous Background Workers (Celery + Redis)

#### Module 7.1: Celery Instance & Redis Broker Wire
* **Target File**: `app/core/celery_app.py`
* **Dependencies**: `celery`, `redis`
* **Sprint**: Sprint 3 (Day 14)

##### Technical Tasks (Max 2)
1. **Task 1 (Celery App Initialization)**: Instantiate Celery application instance configured with Redis broker and Redis result backend, setting JSON serializer and task timeouts.
2. **Task 2 (Concurrency & Prefetch Tuning)**: Tune Celery worker settings for CPU/IO balance: `worker_prefetch_multiplier=1`, `task_acks_late=True`, and 10-minute hard task execution limit.

##### Signatures & Contracts
```python
# app/core/celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "financial_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.core.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_time_limit=600,       # 10 minutes maximum per task
    task_soft_time_limit=540,  # 9 minutes soft warning
    result_expires=86400       # 24 hours result retention
)
```
* **DoD**: `celery -A app.core.celery_app inspect ping` responds with `pong`.

---

#### Module 7.2: Async Document Task Worker & State Tracker
* **Target File**: `app/core/tasks.py`
* **Dependencies**: `celery`, `sqlalchemy`
* **Sprint**: Sprint 3 (Day 14)

##### Technical Tasks (Max 2)
1. **Task 1 (Async Ingestion Orchestrator Task)**: Author Celery task `process_document_task(document_id: str)` executing PDF extraction, chunking, and embedding in background.
2. **Task 2 (Granular Progress State Publisher)**: Publish real-time task progress updates (e.g. `EXTRACTING`, `CHUNKING`, `EMBEDDING`, `COMPLETE`) via Celery state updates accessible by frontend polling.

##### Signatures & Contracts
```python
# app/core/tasks.py
import logging
from celery import shared_task
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="tasks.process_document")
def process_document_task(self, document_id: str, file_path: str):
    """Executes long-running document ingestion pipeline in asynchronous worker."""
    logger.info(f"Starting async processing for document: {document_id}")

    # Stage 1: Extraction
    self.update_state(state="PROGRESS", meta={"stage": "EXTRACTION", "progress_pct": 25})
    # Dev 1's extraction call...

    # Stage 2: Chunking
    self.update_state(state="PROGRESS", meta={"stage": "CHUNKING", "progress_pct": 50})
    # Dev 1's chunking call...

    # Stage 3: Embedding
    self.update_state(state="PROGRESS", meta={"stage": "EMBEDDING", "progress_pct": 75})
    # Dev 1's embedding call...

    # Stage 4: Completed
    return {"document_id": document_id, "status": "COMPLETED", "progress_pct": 100}
```
* **DoD**: Document upload triggers background Celery job; client polls task status and receives progression `25% -> 50% -> 75% -> 100%`.

---

#### Module 7.3: Celery Dedicated Worker Container Engine
* **Target File**: `docker/Dockerfile.worker`
* **Dependencies**: `docker/Dockerfile.api`
* **Sprint**: Sprint 3 (Day 14)

##### Technical Tasks (Max 2)
1. **Task 1 (Worker Container Packaging)**: Inherit from API base image, setting Celery worker execution command with concurrency controls (`--concurrency=2 -P solo` or prefork).
2. **Task 2 (Service Orchestration Integration)**: Add `worker` service into `docker-compose.yml` and `docker-compose.prod.yml` connected to `financial-net`.

##### Signatures & Contracts
```dockerfile
# docker/Dockerfile.worker
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 10001 appgroup && useradd -u 10001 -g appgroup -s /bin/bash -m appuser

COPY --from=financial-api /home/appuser/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

COPY --chown=appuser:appgroup . /app

USER appuser

CMD ["celery", "-A", "app.core.celery_app", "worker", "--loglevel=INFO", "--concurrency=2"]
```
* **DoD**: Worker container starts alongside API and successfully consumes queued jobs from Redis.

---

### Phase 8: Operations, Readiness Probes & Disaster Recovery

#### Module 8.1: PostgreSQL Availability Probe & Wait Hook
* **Target File**: `scripts/wait_for_db.py`
* **Dependencies**: `psycopg2-binary` or `socket`, `time`
* **Sprint**: Sprint 1 (Day 2)

##### Technical Tasks (Max 2)
1. **Task 1 (TCP & Socket Retry Loop)**: Implement polling loop attempting database connection with exponential backoff (max 30 seconds).
2. **Task 2 (Entrypoint Blocker Hook)**: Exit with status code 0 when DB is ready to accept queries; exit with status code 1 if connection times out, preventing premature Alembic migration crashes.

##### Signatures & Contracts
```python
# scripts/wait_for_db.py
import os
import sys
import time
import psycopg2

def wait_for_postgres(timeout_seconds: int = 30) -> None:
    """Blocks execution until PostgreSQL is responsive and accepting connections."""
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/financial_rag")
    start_time = time.time()
    sys.stdout.write("Waiting for PostgreSQL database to become available...")
    sys.stdout.flush()

    while time.time() - start_time < timeout_seconds:
        try:
            conn = psycopg2.connect(db_url)
            conn.close()
            sys.stdout.write(" [READY]\n")
            sys.exit(0)
        except Exception:
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(1)

    sys.stderr.write(f"\n[ERROR] PostgreSQL did not become available within {timeout_seconds}s.\n")
    sys.exit(1)

if __name__ == "__main__":
    wait_for_postgres()
```
* **DoD**: Running `python scripts/wait_for_db.py` blocks until PostgreSQL finishes booting, then exits with returncode 0.

---

#### Module 8.2: Automated Database Seeding & Mock Fixtures
* **Target File**: `scripts/seed_database.py`
* **Dependencies**: `sqlalchemy`, `pydantic`
* **Sprint**: Sprint 1 (Day 5)

##### Technical Tasks (Max 2)
1. **Task 1 (Sample Filing Fixture Ingestion)**: Insert sample records into PostgreSQL for 3 companies (e.g. Apple, Microsoft, Tesla) across FY2023 with pre-calculated ratios and metrics.
2. **Task 2 (Idempotent Execution Guard)**: Check if records already exist before inserting; skip duplicates without throwing primary key constraint violations.

##### Signatures & Contracts
```python
# scripts/seed_database.py
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

SEED_DOCUMENTS = [
    {"id": "doc-aapl-2023", "filename": "AAPL_FY2023_10K.pdf", "ticker": "AAPL", "year": 2023},
    {"id": "doc-msft-2023", "filename": "MSFT_FY2023_10K.pdf", "ticker": "MSFT", "year": 2023},
    {"id": "doc-tsla-2023", "filename": "TSLA_FY2023_10K.pdf", "ticker": "TSLA", "year": 2023},
]

def seed_database() -> None:
    """Populates database with sample records to unblock frontend and API teams immediately."""
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        for doc in SEED_DOCUMENTS:
            conn.execute(
                text("""
                INSERT INTO documents (id, filename, ticker, fiscal_year, status)
                VALUES (:id, :filename, :ticker, :year, 'PROCESSED')
                ON CONFLICT (id) DO NOTHING;
                """),
                doc
            )
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
```
* **DoD**: Running `python scripts/seed_database.py` successfully injects 3 test corporate entities and handles re-runs idempotently.

---

#### Module 8.3: Automated Backup & Snapshot Recovery Script
* **Target File**: `scripts/backup_restore.sh`
* **Dependencies**: `pg_dump`, `pg_restore`, `bash`
* **Sprint**: Sprint 4 (Day 17)

##### Technical Tasks (Max 2)
1. **Task 1 (Compressed Snapshot Dump)**: Execute `pg_dump` with gzip compression outputting timestamped backup archive `backup_YYYYMMDD_HHMMSS.sql.gz`.
2. **Task 2 (Disaster Recovery Restore Action)**: Provide `--restore <backup_file>` flag dropping connections, re-creating database, and restoring all schemas, tables, pgvector embeddings, and indexes.

##### Signatures & Contracts
```bash
#!/usr/bin/env bash
# scripts/backup_restore.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
DB_CONTAINER="${DB_CONTAINER:-financial_postgres}"
DB_NAME="${POSTGRES_DB:-financial_rag}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "$BACKUP_DIR"

backup() {
    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/backup_${DB_NAME}_${timestamp}.sql.gz"
    echo "Starting compressed backup of $DB_NAME..."
    docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$backup_file"
    echo "Backup completed successfully: $backup_file"
}

restore() {
    local backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        echo "Error: Backup file not found: $backup_file"
        exit 1
    fi
    echo "Restoring $DB_NAME from $backup_file..."
    gunzip -c "$backup_file" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    echo "Restore completed successfully."
}

case "${1:-}" in
    --backup)
        backup
        ;;
    --restore)
        restore "${2:-}"
        ;;
    *)
        echo "Usage: $0 {--backup|--restore <file.sql.gz>}"
        exit 1
        ;;
esac
```
* **DoD**: Running `scripts/backup_restore.sh --backup` creates valid gzipped SQL dump; `--restore` reloads data with zero corruption.

---

#### Module 8.4: Production Verification & Smoke Test Runner
* **Target File**: `scripts/verify_deployment.py`
* **Dependencies**: `httpx`, `pytest`
* **Sprint**: Sprint 4 (Day 18)

##### Technical Tasks (Max 2)
1. **Task 1 (Smoke Test Verification Matrix)**: Query `/health`, `/metrics`, `/docs`, and Next.js UI endpoints verifying status 200 and latency < 500ms.
2. **Task 2 (CLI Summary Exit Code)**: Output formatted deployment verification summary table and exit with status code 0 only if 100% of checks pass.

##### Signatures & Contracts
```python
# scripts/verify_deployment.py
import sys
import httpx

CHECKS = [
    {"name": "API Health Probe", "url": "http://localhost:8000/health", "expected_status": 200},
    {"name": "Prometheus Metrics", "url": "http://localhost:8000/metrics", "expected_status": 200},
    {"name": "Swagger OpenAPI Docs", "url": "http://localhost:8000/docs", "expected_status": 200},
    {"name": "Next.js Frontend", "url": "http://localhost:3000/", "expected_status": 200},
]

def run_smoke_tests() -> bool:
    all_passed = True
    print("=" * 60)
    print("   PRODUCTION DEPLOYMENT VERIFICATION SMOKE TESTS")
    print("=" * 60)

    for check in CHECKS:
        try:
            r = httpx.get(check["url"], timeout=5.0)
            if r.status_code == check["expected_status"]:
                print(f"  [PASS] {check['name']:<25} ({r.status_code}) - {r.elapsed.total_seconds()*1000:.1f}ms")
            else:
                print(f"  [FAIL] {check['name']:<25} - Expected {check['expected_status']}, Got {r.status_code}")
                all_passed = False
        except Exception as e:
            print(f"  [FAIL] {check['name']:<25} - Connection Failed: {e}")
            all_passed = False

    print("=" * 60)
    return all_passed

if __name__ == "__main__":
    success = run_smoke_tests()
    sys.exit(0 if success else 1)
```
* **DoD**: Running script against active Docker containers outputs green table and exits 0.

---

## 3. Sprint Timeline & Day-by-Day Tactical Checklist

| Sprint | Days | Micro-Modules Covered | Primary Milestone Delivered |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Days 1-2 | Modules 1.1, 1.2, 1.3, 8.1 | Pre-commit hooks, strict settings, structured JSON logs, wait-for-db hook |
| **Sprint 1** | Days 3-4 | Modules 2.1, 2.2, 2.3, 3.1 | Multi-stage Dockerfiles for API & Frontend, local Compose mesh, Lint CI |
| **Sprint 1** | Day 5 | Module 8.2 | Seed database fixture script unblocking Dev 2 & Dev 3 |
| **Sprint 2** | Days 6-7 | Modules 4.1, 4.2, 4.3, 4.4 | Zero-trust upload security, input sanitizer, prompt injection guard, CORS |
| **Sprint 2** | Day 8 | Modules 3.2, 6.1 | GitHub Actions Pytest CI with real Postgres & Redis, deep `/health` probe |
| **Sprint 3** | Days 11-12 | Modules 5.1, 5.2, 6.2, 6.3 | Rate limiter, client IP resolver, Prometheus instrumentation & scrape rules |
| **Sprint 3** | Days 13-14 | Modules 2.4, 7.1, 7.2, 7.3 | Production hardened Compose, Celery + Redis worker configuration |
| **Sprint 4** | Days 15-16 | Modules 6.4, 3.3 | Grafana dashboard provisioning, Trivy CVE vulnerability scan CI |
| **Sprint 4** | Days 17-18 | Modules 8.3, 8.4, 3.4 | Automated DB backup/restore, smoke test runner, GitHub release & GHCR push |

---

## 4. Parallel Development Interface Contracts

To ensure you (Dev 4) can build and ship platform capabilities without blocking or waiting on Dev 1, Dev 2, or Dev 3:

```mermaid
sequenceDiagram
    autonumber
    participant Dev4 as Dev 4 (DevOps & Security - Tejas)
    participant Dev1 as Dev 1 (AI & Analytics)
    participant Dev2 as Dev 2 (Backend & DB)
    participant Dev3 as Dev 3 (Frontend & Visuals)

    Note over Dev4,Dev2: Contract 1: Environment & Container Mesh
    Dev4->>Dev2: Delivers .env.example, PostgreSQL container, and wait_for_db.py
    Note over Dev4,Dev3: Contract 2: Frontend Network & Port Ingress
    Dev4->>Dev3: Delivers Dockerfile.next, Next.js port 3000, and NEXT_PUBLIC_API_BASE_URL
    Note over Dev4,Dev1: Contract 3: AI Sandboxing & Injection Defenses
    Dev4->>Dev1: Delivers PromptSecurityEngine & <context> delimiter wrappers
    Note over Dev4,Dev2: Contract 4: Security & Rate Limiting Middleware
    Dev4->>Dev2: Delivers slowapi rate limiter, file magic-byte validator, and CORS
```

### Published Contracts
1. **Contract to Dev 1 (AI & RAG Lead)**:
   - Provide `<context>` XML wrapping helper in `app/core/security.py` so Dev 1 can simply call `wrap_in_sandboxed_delimiters(chunks)` inside `rag_service.py`.
2. **Contract to Dev 2 (Backend Lead)**:
   - Provide `settings` from `app/core/config.py` with validated `DATABASE_URL`.
   - Provide `FileSecurityValidator.validate_file_buffer` to plug directly into `/documents/upload`.
   - Provide `limiter` from `app/core/rate_limit.py` to annotate endpoints with `@limiter.limit("10/minute")`.
3. **Contract to Dev 3 (Frontend Lead)**:
   - Provide `Dockerfile.frontend` and Docker Compose service mapping `8501:8501`.
   - Expose environment variable `API_BASE_URL=http://localhost:8000` (or `http://api:8000` in container).

---

## 5. Immediate Day 1 Action Plan

To start right now and unblock the entire team:

1. **Scaffold DevOps & Core directories**:
   ```bash
   mkdir -p docker/monitoring/grafana/dashboards docker/monitoring/grafana/provisioning/datasources .github/workflows app/core scripts
   ```

2. **Build Module 1.1 (`.pre-commit-config.yaml` & `pyproject.toml`)**:
   - Run `pip install pre-commit black ruff mypy`
   - Run `pre-commit install`
   - Unblocks entire team with clean, consistent code formatting standards.

3. **Build Module 1.2 (`app/core/config.py`) & `.env.example`**:
   - Create Pydantic Settings model.
   - Unblocks Developer 2 to configure SQLAlchemy engine without hardcoded strings.

4. **Build Module 2.1 (`docker/Dockerfile.api`) & Module 2.3 (`docker-compose.yml`)**:
   - Start PostgreSQL with pgvector and Redis via `docker compose up -d postgres redis`.
   - Developer 1 and Developer 2 now have live databases running locally with one command!
