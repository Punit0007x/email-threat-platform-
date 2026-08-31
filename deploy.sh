#!/bin/bash
set -e

# ============================================
# eRakshak - One-Command Deployment Script
# ============================================
# Usage:
#   bash deploy.sh setup    - First-time setup (creates .env, secrets, data dirs)
#   bash deploy.sh start    - Build and start all services
#   bash deploy.sh stop     - Stop all services
#   bash deploy.sh restart  - Restart all services
#   bash deploy.sh logs     - View logs
#   bash deploy.sh status   - Check service health
#   bash deploy.sh update   - Pull latest code and rebuild

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.prod.yml"

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  eRakshak Deployment Manager${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

setup() {
    print_header
    echo -e "${YELLOW}Setting up eRakshak for production...${NC}"
    echo ""

    # Create directories
    echo "Creating directories..."
    mkdir -p data models secrets

    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating .env from template..."
        cp .env.production .env
        echo -e "${RED}>>> IMPORTANT: Edit .env and fill in your API keys!${NC}"
        echo -e "${RED}>>> Required keys:${NC}"
        echo -e "${RED}>>>   - SECRET_KEY (run: openssl rand -hex 32)${NC}"
        echo -e "${RED}>>>   - GEMINI_API_KEY (free from aistudio.google.com)${NC}"
        echo -e "${RED}>>>   - GOOGLE_CLIENT_ID (from console.cloud.google.com)${NC}"
        echo -e "${RED}>>>   - GOOGLE_CLIENT_SECRET (from console.cloud.google.com)${NC}"
        echo ""
    else
        echo ".env already exists, skipping..."
    fi

    # Create secret files if they don't exist
    if [ ! -f secrets/secret_key.txt ]; then
        echo "Generating secret key..."
        openssl rand -hex 32 > secrets/secret_key.txt
    fi

    if [ ! -f secrets/gemini_api_key.txt ]; then
        echo "Creating placeholder for Gemini API key..."
        echo "CHANGE_ME" > secrets/gemini_api_key.txt
        echo -e "${RED}>>> Edit secrets/gemini_api_key.txt with your real Gemini API key${NC}"
    fi

    # Ensure data directory has proper permissions
    chmod 755 data

    echo ""
    echo -e "${GREEN}Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env with your API keys"
    echo "  2. Edit Caddyfile with your domain (or use IP-only)"
    echo "  3. Run: bash deploy.sh start"
    echo ""
}

start() {
    print_header
    echo "Building and starting services..."
    echo ""

    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${RED}No .env file found. Run 'bash deploy.sh setup' first.${NC}"
        exit 1
    fi

    docker compose -f "$COMPOSE_FILE" up -d --build

    echo ""
    echo -e "${GREEN}Services started!${NC}"
    echo ""
    echo "  Frontend:  http://localhost:5173 (or http://YOUR_IP)"
    echo "  Backend:   http://localhost:8000"
    echo "  Caddy:     http://localhost:80 (with SSL on 443)"
    echo ""
    echo "Check status: bash deploy.sh status"
    echo "View logs:    bash deploy.sh logs"
    echo ""
}

stop() {
    print_header
    echo "Stopping services..."
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}Services stopped.${NC}"
}

restart() {
    stop
    start
}

logs() {
    docker compose -f "$COMPOSE_FILE" logs -f --tail=100
}

status() {
    print_header
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Health checks:"
    curl -sf http://localhost:8000/health/ready 2>/dev/null && echo -e "\n${GREEN}API: healthy${NC}" || echo -e "${RED}API: unhealthy${NC}"
}

update() {
    print_header
    echo "Pulling latest code..."
    git pull
    echo "Rebuilding and restarting..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo -e "${GREEN}Update complete!${NC}"
}

case "${1:-help}" in
    setup)   setup ;;
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    logs)    logs ;;
    status)  status ;;
    update)  update ;;
    *)
        print_header
        echo "Usage: bash deploy.sh {setup|start|stop|restart|logs|status|update}"
        echo ""
        echo "  setup    - First-time setup (.env, secrets, directories)"
        echo "  start    - Build and start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View live logs"
        echo "  status   - Check service health"
        echo "  update   - Pull latest code and rebuild"
        echo ""
        ;;
esac
