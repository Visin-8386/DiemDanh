.PHONY: up down logs logs-api logs-ai restart build ps \
        db-migrate db-seed db-studio shell-api shell-ai clean backup

# ─────────────────────────────────────────
# Core Operations
# ─────────────────────────────────────────
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose build --no-cache

ps:
	docker compose ps

# ─────────────────────────────────────────
# Logs
# ─────────────────────────────────────────
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-ai:
	docker compose logs -f ai-service

# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
db-migrate:
	docker compose exec api npx prisma migrate deploy

db-seed:
	docker compose exec api npm run seed

db-studio:
	docker compose exec api npx prisma studio

# ─────────────────────────────────────────
# Shells
# ─────────────────────────────────────────
shell-api:
	docker compose exec api sh

shell-ai:
	docker compose exec ai-service bash

# ─────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────
clean:
	docker compose down -v --rmi local

# ─────────────────────────────────────────
# Backup
# ─────────────────────────────────────────
backup:
	@echo "Creating database backup..."
	@mkdir -p ./backups
	docker compose exec -T postgres pg_dump \
		-U $${POSTGRES_USER} \
		-d $${POSTGRES_DB} \
		> ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to ./backups/"
