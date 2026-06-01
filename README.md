# 🎭 DiemDanh – Face Recognition Attendance System

> Hệ thống chấm công nhận diện khuôn mặt thời gian thực  
> **Real-time Face Recognition Attendance powered by AI**

---

## 🏗️ Architecture

```
                        ┌─────────────────────────────────┐
                        │         Docker Network           │
                        │          diemdanh_net            │
                        │                                  │
         HTTP :80       │  ┌───────────────────────────┐   │
  Client ──────────────►│  │        nginx:1.25         │   │
                        │  │     Reverse Proxy         │   │
                        │  └──────────┬────────────────┘   │
                        │             │                     │
               ┌────────┼─────────────┼──────────┐         │
               │        │             │           │         │
        /api/* │  /* ───┘    /ai/* ───┘           │         │
               │                                  │         │
               ▼                 ▼                ▼         │
  ┌────────────────┐   ┌──────────────┐  ┌─────────────┐   │
  │  api:4000      │   │  web:3000    │  │ ai-service  │   │
  │  NestJS        │   │  Next.js     │  │ :5000       │   │
  │  REST + Swagger│   │  Frontend    │  │ FastAPI     │   │
  └───────┬────────┘   └──────────────┘  └──────┬──────┘   │
          │                                      │          │
    ┌─────┼──────────────────────────────────────┘          │
    │     │                                                  │
    ▼     ▼                                                  │
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
  │  postgres   │   │   redis     │   │   minio     │       │
  │  :5432      │   │   :6379     │   │  :9000/9001 │       │
  │  PostgreSQL │   │  Cache/     │   │  Object     │       │
  │  16-alpine  │   │  Sessions   │   │  Storage    │       │
  └─────────────┘   └─────────────┘   └─────────────┘       │
                                                             │
                        └─────────────────────────────────┘
```

---

## 📦 Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ≥ 4.25 | Engine + Compose included |
| [Git](https://git-scm.com/) | ≥ 2.40 | Version control |
| [GNU Make](https://www.gnu.org/software/make/) | ≥ 4.0 | Optional – for `make` commands |
| RAM | ≥ 8 GB | AI service needs headroom |
| Disk | ≥ 10 GB | Images + face photo storage |

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/diemdanh.git
cd diemdanh

# 2. Set up environment variables
cp .env.example .env
# Edit .env and change all passwords before going to production!

# 3. Start all services
make up

# 4. Run database migrations
make db-migrate

# 5. Seed the database (creates default admin)
make db-seed
```

> [!NOTE]
> First boot may take 2–3 minutes while Docker pulls images and builds services.

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost | Next.js frontend |
| **API Docs** | http://localhost/api/docs | Swagger / OpenAPI |
| **AI Service Docs** | http://localhost/ai/docs | FastAPI auto-docs |
| **MinIO Console** | http://localhost:9001 | Object storage UI |
| **PostgreSQL** | `localhost:5432` | Direct DB access |
| **Redis** | `localhost:6379` | Cache / session store |

---

## 🔑 Default Credentials

> [!CAUTION]
> Change all passwords in `.env` before deploying to a production environment.

| Service | Username | Password |
|---------|----------|----------|
| **Admin account** | `admin@company.com` | `Admin@123456` |
| **PostgreSQL** | `diemdanh_user` | `StrongPass@2024` |
| **MinIO Console** | `minioadmin` | `MinioPass@2024` |

---

## 🛠️ Make Commands Reference

### Core Operations

| Command | Description |
|---------|-------------|
| `make up` | Start all services in detached mode |
| `make down` | Stop all services |
| `make restart` | Restart all services |
| `make build` | Rebuild all images (no cache) |
| `make ps` | Show running containers & health |

### Logs

| Command | Description |
|---------|-------------|
| `make logs` | Tail all service logs |
| `make logs-api` | Tail NestJS API logs |
| `make logs-ai` | Tail AI service logs |

### Database

| Command | Description |
|---------|-------------|
| `make db-migrate` | Run Prisma migrations |
| `make db-seed` | Seed default data |
| `make db-studio` | Open Prisma Studio (ORM UI) |

### Shells

| Command | Description |
|---------|-------------|
| `make shell-api` | Shell into the API container |
| `make shell-ai` | Shell into the AI service container |

### Maintenance

| Command | Description |
|---------|-------------|
| `make backup` | Dump PostgreSQL to `./backups/` |
| `make clean` | Remove containers, volumes, and local images |

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Reverse Proxy** | Nginx | 1.25-alpine |
| **Frontend** | Next.js (React) | 14+ |
| **Backend API** | NestJS (Node.js) | 10+ |
| **AI Service** | FastAPI (Python) | 0.110+ |
| **Face Recognition** | DeepFace / InsightFace | latest |
| **Database** | PostgreSQL | 16-alpine |
| **ORM** | Prisma | 5+ |
| **Cache / Sessions** | Redis | 7-alpine |
| **Object Storage** | MinIO | latest |
| **Containerization** | Docker + Compose | v3.9 |

---

## 📁 Project Structure

```
diemdanh/
├── docker-compose.yml          # All service definitions
├── .env                        # Environment variables (⚠️ not committed)
├── .env.example                # Template – copy to .env
├── Makefile                    # Dev-ops shortcuts
├── infrastructure/
│   ├── nginx/
│   │   └── nginx.conf          # Reverse proxy config
│   ├── postgres/
│   │   └── init.sql            # DB extensions + timezone
│   └── minio/
│       └── setup.sh            # Bucket creation script
└── services/
    ├── web/                    # Next.js frontend
    ├── api/                    # NestJS backend
    └── ai-service/             # FastAPI face recognition
```

---

## 🔒 Security Notes

- All inter-service communication happens inside the private `diemdanh_net` Docker network.
- Only **Nginx (port 80)** is exposed to the host by default.
- Database ports (5432, 6379) are exposed for local development — remove port mappings in production.
- MinIO ports (9000, 9001) are exposed for local development only.
- JWT tokens expire in **15 minutes**; refresh tokens in **7 days**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT © 2024 DiemDanh Team
