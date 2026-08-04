# ===========================================================================
# MeetingMind — Root Makefile
#
# Orchestrates lint, typecheck, test, format, and build across all apps.
# Run `make help` for the full list.
# ===========================================================================

.DEFAULT_GOAL := help
SHELL := /bin/bash

# ---- Paths ---------------------------------------------------------------
BACKEND  := apps/backend
FRONTEND := apps/frontend
EXTENSION := apps/extension

# ---- Convenience ----------------------------------------------------------
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ===========================================================================
# Lint
# ===========================================================================
.PHONY: lint lint-backend lint-frontend lint-extension

lint: lint-backend lint-frontend lint-extension ## Lint all projects

lint-backend: ## Ruff lint + format check
	cd $(BACKEND) && poetry run ruff check . && poetry run ruff format --check .

lint-frontend: ## ESLint (Next.js)
	cd $(FRONTEND) && npm run lint

lint-extension: ## ESLint (Extension)
	cd $(EXTENSION) && npm run lint

# ===========================================================================
# Type-check
# ===========================================================================
.PHONY: typecheck typecheck-backend typecheck-frontend typecheck-extension

typecheck: typecheck-backend typecheck-frontend typecheck-extension ## Type-check all projects

typecheck-backend: ## MyPy strict
	cd $(BACKEND) && poetry run mypy app

typecheck-frontend: ## tsc --noEmit
	cd $(FRONTEND) && npm run typecheck

typecheck-extension: ## tsc --noEmit
	cd $(EXTENSION) && npm run typecheck

# ===========================================================================
# Test
# ===========================================================================
.PHONY: test test-backend

test: test-backend ## Run all tests

test-backend: ## pytest
	cd $(BACKEND) && poetry run pytest --tb=short -q

# ===========================================================================
# Format (auto-fix)
# ===========================================================================
.PHONY: format format-backend

format: format-backend ## Auto-format all projects

format-backend: ## Ruff format + isort
	cd $(BACKEND) && poetry run ruff format . && poetry run ruff check --fix .

# ===========================================================================
# Build
# ===========================================================================
.PHONY: build build-frontend build-extension

build: build-frontend build-extension ## Build all frontend artifacts

build-frontend: ## Next.js production build
	cd $(FRONTEND) && npm run build

build-extension: ## Vite extension build
	cd $(EXTENSION) && npm run build

# ===========================================================================
# All checks (mirrors CI)
# ===========================================================================
.PHONY: ci
ci: lint typecheck test build ## Run the full CI check suite locally
