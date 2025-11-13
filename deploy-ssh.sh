#!/bin/bash

# BekerjaLuarNegri.com SSH Deployment Script
# Usage: ./deploy-ssh.sh [vps-ip] [vps-user] [ssh-key-path]

set -e

# Configuration
VPS_IP=${1:-"YOUR_VPS_IP"}
VPS_USER=${2:-"root"}
SSH_KEY=${3:-"~/.ssh/id_rsa"}
APP_NAME="bekerjakeluarnegri"
REMOTE_DIR="/var/www/$APP_NAME"
SERVICE_NAME="$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_local_files() {
    print_status "Checking local files..."

    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Run this from the project root."
        exit 1
    fi

    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found. Please create it first."
        exit 1
    fi

    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found."
        exit 1
    fi

    print_success "All required files found locally."
}

# Test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to $VPS_USER@$VPS_IP..."

    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_IP" "echo 'SSH connection successful'" 2>/dev/null; then
        print_success "SSH connection established."
    else
        print_error "SSH connection failed. Please check:"
        print_error "1. VPS IP address: $VPS_IP"
        print_error "2. SSH user: $VPS_USER"
        print_error "3. SSH key path: $SSH_KEY"
        print_error "4. SSH key is added to agent: ssh-add $SSH_KEY"
        exit 1
    fi
}

# Setup remote server
setup_remote_server() {
    print_status "Setting up remote server..."

    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" << 'EOF'
set -e

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing Docker and dependencies..."
apt install -y docker.io docker-compose curl wget git

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add user to docker group (if not root)
if [ "$USER" != "root" ]; then
    usermod -aG docker $USER
fi

# Create app directory
echo "Creating application directory..."
mkdir -p /var/www/bekerjakeluarnegri

# Create docker-compose override for production
cat > /var/www/bekerjakeluarnegri/docker-compose.override.yml << 'EOL'
version: '3.8'
services:
  app:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/init-db"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOL

echo "Remote server setup completed."
EOF

    if [ $? -eq 0 ]; then
        print_success "Remote server setup completed."
    else
        print_error "Remote server setup failed."
        exit 1
    fi
}

# Upload files to VPS
upload_files() {
    print_status "Uploading application files to VPS..."

    # Create temporary tarball
    TEMP_TAR="/tmp/$APP_NAME-$(date +%s).tar.gz"

    # Create tarball excluding unnecessary files
    tar -czf "$TEMP_TAR" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.DS_Store' \
        --exclude='*.log' \
        --exclude='.claude' \
        --exclude='TEMPLATE*' \
        --exclude='*.docx' \
        --exclude='domain no-reply.png' \
        --exclude='nul' \
        .

    # Upload to VPS
    scp -i "$SSH_KEY" "$TEMP_TAR" "$VPS_USER@$VPS_IP:/tmp/"

    # Extract on VPS
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" << EOF
cd /var/www/$APP_NAME
rm -rf ./*
tar -xzf /tmp/$(basename $TEMP_TAR) --strip-components=1
rm /tmp/$(basename $TEMP_TAR)
EOF

    # Clean up local temp file
    rm "$TEMP_TAR"

    print_success "Files uploaded and extracted successfully."
}

# Deploy application
deploy_application() {
    print_status "Deploying application..."

    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" << EOF
cd /var/www/$APP_NAME

# Stop existing container if running
echo "Stopping existing container..."
docker-compose down 2>/dev/null || true

# Build and start application
echo "Building and starting application..."
docker-compose build --no-cache
docker-compose up -d

# Wait for application to start
echo "Waiting for application to start..."
sleep 30

# Check if application is running
if docker-compose ps | grep -q "Up"; then
    echo "Application is running successfully!"

    # Show logs
    echo "=== Application Logs ==="
    docker-compose logs --tail=20

    echo "=== Container Status ==="
    docker-compose ps
else
    echo "Application failed to start. Checking logs..."
    docker-compose logs
    exit 1
fi
EOF

    if [ $? -eq 0 ]; then
        print_success "Application deployed successfully!"
    else
        print_error "Deployment failed. Check the logs above."
        exit 1
    fi
}

# Show deployment info
show_deployment_info() {
    VPS_URL="http://$VPS_IP:3211"

    print_success "Deployment completed! 🎉"
    echo
    echo "📱 Application URL: $VPS_URL"
    echo "🔧 Admin URL: $VPS_URL/admin"
    echo "📊 Health Check: $VPS_URL/api/init-db"
    echo
    echo "📋 Useful Commands:"
    echo "  View logs: ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd /var/www/$APP_NAME && docker-compose logs -f'"
    echo "  Restart app: ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd /var/www/$APP_NAME && docker-compose restart'"
    echo "  Update app: ./deploy-ssh.sh $VPS_IP $VPS_USER $SSH_KEY"
    echo
    print_warning "Don't forget to configure your domain name and SSL certificate!"
}

# Main deployment flow
main() {
    echo "🚀 BekerjaLuarNegri.com SSH Deployment"
    echo "======================================"
    echo "VPS: $VPS_USER@$VPS_IP"
    echo "App: $APP_NAME"
    echo

    check_local_files
    test_ssh_connection

    read -p "Do you want to setup the remote server? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_remote_server
    fi

    upload_files
    deploy_application
    show_deployment_info
}

# Run main function
main "$@"