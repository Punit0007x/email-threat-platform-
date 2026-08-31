# ============================================
# eRakshak - AWS One-Click Deployment Script
# ============================================
# Runs on your LOCAL machine. Connects to AWS via SSH.
#
# Usage:
#   bash deploy-aws.sh setup          - Deploy everything to AWS instance
#   bash deploy-aws.sh status         - Check service health on AWS
#   bash deploy-aws.sh logs           - View logs on AWS
#   bash deploy-aws.sh restart        - Restart services on AWS
#   bash deploy-aws.sh stop           - Stop services on AWS
#   bash deploy-aws.sh update         - Pull latest code + rebuild on AWS
#   bash deploy-aws.sh setup-domain   - Configure domain + SSL (requires domain)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# CONFIGURATION - EDIT THESE
# ============================================
INSTANCE_IP="65.2.189.200"          # Your AWS Lightsail/EC2 public IP
SSH_USER="ubuntu"       # 'ubuntu' for Ubuntu, 'ec2-user' for Amazon Linux
SSH_KEY="/Users/punit007x/Downloads/LightsailDefaultKey-ap-south-1.pem"  # Path to your SSH private key
DOMAIN=""               # Your domain (e.g. erakshak.com). Leave empty for IP-only.

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  eRakshak - AWS Deployment Tool${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

check_config() {
    if [ -z "$INSTANCE_IP" ]; then
        echo -e "${RED}ERROR: Set INSTANCE_IP at the top of this script${NC}"
        echo -e "${RED}Example: INSTANCE_IP=\"54.123.456.789\"${NC}"
        exit 1
    fi
}

aws_cmd() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$SSH_USER@$INSTANCE_IP" "$1"
}

deploy_full() {
    print_header
    check_config
    echo -e "${GREEN}Deploying eRakshak to AWS instance $INSTANCE_IP${NC}"
    echo ""

    echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
    aws_cmd "sudo apt-get update -qq && sudo apt-get install -y -qq docker.io docker-compose-v2 git curl > /dev/null 2>&1" || aws_cmd "sudo yum update -y && sudo yum install -y docker git curl && sudo service docker start" 
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[2/8] Adding user to docker group...${NC}"
    aws_cmd "sudo usermod -aG docker $SSH_USER && sudo systemctl enable docker > /dev/null 2>&1 && sudo systemctl start docker"
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[3/8] Cloning repository...${NC}"
    # If repo already exists, pull latest
    if aws_cmd "[ -d ~/email_threat_platform ]"; then
        echo "  Repo exists, pulling latest..."
        aws_cmd "cd ~/email_threat_platform && git pull"
    else
        echo -e "${RED}Enter your GitHub repository URL:${NC}"
        read -r -p "  Repo URL: " REPO_URL
        aws_cmd "git clone $REPO_URL ~/email_threat_platform"
    fi
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[4/8] Creating directories and secrets...${NC}"
    aws_cmd "mkdir -p ~/email_threat_platform/data ~/email_threat_platform/models ~/email_threat_platform/secrets"
    
    # Generate secret key if not exists
    if ! aws_cmd "[ -f ~/email_threat_platform/secrets/secret_key.txt ]"; then
        aws_cmd "openssl rand -hex 32 > ~/email_threat_platform/secrets/secret_key.txt"
        echo -e "${GREEN}  Generated new SECRET_KEY.${NC}"
    else
        echo -e "${GREEN}  SECRET_KEY already exists, keeping.${NC}"
    fi
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[5/8] Setting up .env file with your keys...${NC}"
    # Create .env from local .env.production (which has your API keys)
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}ERROR: .env.production not found locally. Run setup first.${NC}"
        exit 1
    fi

    # Copy .env.production locally to .env and adjust CORS
    cp .env.production .env
    if [ -n "$DOMAIN" ]; then
        sed -i '' "s|CORS_ORIGINS=.*|CORS_ORIGINS=[\"https://$DOMAIN\"]|" .env
    else
        sed -i '' "s|CORS_ORIGINS=.*|CORS_ORIGINS=[\"http://$INSTANCE_IP\"]|" .env
    fi

    # Transfer .env to server
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no .env "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/.env"
    
    # Create secret files on server
    if [ ! -f "secrets/secret_key.txt" ]; then
        openssl rand -hex 32 > secrets/secret_key.txt
    fi
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no secrets/secret_key.txt "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/secrets/secret_key.txt" 2>/dev/null || aws_cmd "openssl rand -hex 32 > ~/email_threat_platform/secrets/secret_key.txt"
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no secrets/gemini_api_key.txt "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/secrets/gemini_api_key.txt" 2>/dev/null || echo "GEMINI_KEY_MISSING"
    echo -e "${GREEN}  .env and secrets transferred to server.${NC}"

    # Clean up the temp local .env we created
    rm -f .env
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[6/8] Configuring Caddyfile (proxy)...${NC}"
    if [ -n "$DOMAIN" ]; then
        # Write domain-based Caddyfile
        cat > /tmp/Caddyfile.aws << EOF
$DOMAIN {
    reverse_proxy frontend:5173

    handle /api/* {
        reverse_proxy api:8000
    }

    handle /health/* {
        reverse_proxy api:8000
    }

    handle /metrics {
        reverse_proxy api:8000
    }

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }

    encode gzip
}
EOF
        scp -i "$SSH_KEY" /tmp/Caddyfile.aws "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/Caddyfile"
        echo -e "${GREEN}  Domain config for $DOMAIN written.${NC}"
    else
        # Write IP-based Caddyfile
        cat > /tmp/Caddyfile.aws << EOF
:80 {
    reverse_proxy frontend:5173

    handle /api/* {
        reverse_proxy api:8000
    }

    handle /health/* {
        reverse_proxy api:8000
    }

    handle /metrics {
        reverse_proxy api:8000
    }

    encode gzip
}
EOF
        scp -i "$SSH_KEY" /tmp/Caddyfile.aws "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/Caddyfile"
        echo -e "${GREEN}  IP-based config written.${NC}"
    fi
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[7/8] Building and starting containers...${NC}"
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml up -d --build"
    echo -e "${GREEN}  Done.${NC}"

    echo -e "${YELLOW}[8/8] Waiting for services to be healthy...${NC}"
    sleep 30
    echo -e "${GREEN}  Done.${NC}"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Your app is live at:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  https://$DOMAIN"
    else
        echo -e "  http://$INSTANCE_IP"
    fi
    echo ""
    echo -e "${GREEN}API endpoints:${NC}"
    echo -e "  Health:    http://$INSTANCE_IP/health/ready"
    echo -e "  API Docs:  http://$INSTANCE_IP/docs"
    echo ""
    echo -e "${YELLOW}To check status:  bash deploy-aws.sh status${NC}"
    echo -e "${YELLOW}To view logs:     bash deploy-aws.sh logs${NC}"
    echo ""
    echo -e "${RED}IMPORTANT: Open ports 80 and 8000 in your AWS firewall!"
    echo -e "  Lightsail: Instance > Networking > Firewall > Add rule"
    echo -e "    80   - HTTP (Sources: Anywhere)"
    echo -e "    443  - HTTPS (Sources: Anywhere) [if using domain]"
    echo -e "    8000 - API (Sources: Anywhere)${NC}"
    echo ""
}

aws_status() {
    print_header
    check_config
    echo -e "${GREEN}Checking service health on $INSTANCE_IP...${NC}"
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml ps"
    echo ""
    echo -e "${GREEN}API Health Check:${NC}"
    curl -sf "http://$INSTANCE_IP/health/ready" 2>/dev/null && echo -e "\n${GREEN}API: Healthy ✓${NC}" || echo -e "${RED}API: Not reachable${NC}"
}

aws_logs() {
    print_header
    check_config
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml logs -f --tail=100"
}

aws_restart() {
    print_header
    check_config
    echo "Restarting services..."
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml restart"
    echo -e "${GREEN}Services restarted.${NC}"
}

aws_stop() {
    print_header
    check_config
    echo "Stopping services..."
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml down"
    echo -e "${GREEN}Services stopped.${NC}"
}

aws_update() {
    print_header
    check_config
    echo "Updating deployment..."
    aws_cmd "cd ~/email_threat_platform && git pull && sudo docker compose -f docker-compose.prod.yml up -d --build"
    echo -e "${GREEN}Update complete.${NC}"
}

aws_setup_domain() {
    print_header
    check_config
    echo -e "${YELLOW}Domain setup for Caddy + SSL (Let's Encrypt auto)${NC}"
    echo ""
    
    echo -e "1. In Route 53 (AWS), create an A record:"
    echo -e "${CYAN}   Name:  app.yourdomain.com (or just yourdomain.com)${NC}"
    echo -e "${CYAN}   Type:  A${NC}"
    echo -e "${CYAN}   Value: $INSTANCE_IP${NC}"
    echo ""
    
    read -r -p "Enter your domain (e.g. app.erakshak.com): " NEW_DOMAIN
    
    echo -e "${YELLOW}Updating Caddyfile with domain...${NC}"
    cat > /tmp/Caddyfile.aws << EOF
$NEW_DOMAIN {
    reverse_proxy frontend:5173

    handle /api/* {
        reverse_proxy api:8000
    }

    handle /health/* {
        reverse_proxy api:8000
    }

    handle /metrics {
        reverse_proxy api:8000
    }

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }

    encode gzip
}
EOF
    scp -i "$SSH_KEY" /tmp/Caddyfile.aws "$SSH_USER@$INSTANCE_IP:~/email_threat_platform/Caddyfile"

    echo -e "${YELLOW}Updating CORS in .env${NC}"
    aws_cmd "cd ~/email_threat_platform && sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=[\"https://$NEW_DOMAIN\"]|' .env"

    echo -e "${YELLOW}Restarting Caddy...${NC}"
    aws_cmd "cd ~/email_threat_platform && sudo docker compose -f docker-compose.prod.yml up -d caddy"

    echo -e "${GREEN}Done! HTTPS will auto-provision via Let's Encrypt.${NC}"
    echo -e "${GREEN}Your app: https://$NEW_DOMAIN${NC}"
    echo -e "${GREEN}Make sure port 443 is open in your AWS firewall.${NC}"
}

case "${1:-help}" in
    setup)          deploy_full ;;
    status)         aws_status ;;
    logs)           aws_logs ;;
    restart)        aws_restart ;;
    stop)           aws_stop ;;
    update)         aws_update ;;
    setup-domain)   aws_setup_domain ;;
    *)
        print_header
        echo "Usage: bash deploy-aws.sh {setup|status|logs|restart|stop|update|setup-domain}"
        echo ""
        echo "  setup          - Full deployment to AWS (first time)"
        echo "  status         - Check service health"
        echo "  logs           - View live logs"
        echo "  restart        - Restart all services"
        echo "  stop           - Stop all services"
        echo "  update         - Pull latest code and rebuild"
        echo "  setup-domain   - Configure domain + SSL"
        echo ""
        echo "Before first run, edit the CONFIG at the top of this script:"
        echo "  INSTANCE_IP=\"your-aws-ip\""
        echo "  SSH_USER=\"ubuntu\""
        echo "  SSH_KEY=\"~/.ssh/id_rsa\""
        echo "  DOMAIN=\"\" (optional)"
        echo ""
        ;;
esac
