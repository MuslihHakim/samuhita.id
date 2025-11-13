#!/bin/bash

# Remote Server Setup Script for BekerjaLuarNegri.com
# Run this script directly on your VPS
# Usage: curl -sSL https://your-repo/remote-setup.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root or with sudo"
        exit 1
    fi
}

# Update system
update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated."
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."

    # Install required packages
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Set up the repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    print_success "Docker installed and started."
}

# Install additional tools
install_tools() {
    print_status "Installing additional tools..."
    apt install -y curl wget git unzip htop nano ufw
    print_success "Tools installed."
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."

    # Reset firewall rules
    ufw --force reset

    # Default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH
    ufw allow ssh

    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3211/tcp

    # Enable firewall
    ufw --force enable

    print_success "Firewall configured."
}

# Create application directory
setup_app_directory() {
    print_status "Creating application directory..."

    APP_DIR="/var/www/bekerjakeluarnegri"

    # Create directory
    mkdir -p "$APP_DIR"

    # Set permissions
    chown -R root:root "$APP_DIR"
    chmod 755 "$APP_DIR"

    # Create docker-compose override for production
    cat > "$APP_DIR/docker-compose.override.yml" << 'EOF'
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
      test: ["CMD", "curl", "-f", "http://localhost:3211/api/init-db"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

    print_success "Application directory created at $APP_DIR"
}

# Setup swap file (optional but recommended)
setup_swap() {
    print_status "Setting up swap file..."

    # Create 2GB swap file
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Add to fstab
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # Configure swappiness
    echo 'vm.swappiness=10' >> /etc/sysctl.conf

    print_success "Swap file configured."
}

# Create systemd service for docker-compose
create_systemd_service() {
    print_status "Creating systemd service..."

    cat > /etc/systemd/system/bekerjakeluarnegri.service << 'EOF'
[Unit]
Description=BekerjaLuarNegri.com Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/bekerjakeluarnegri
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable bekerjakeluarnegri.service

    print_success "Systemd service created and enabled."
}

# Show system info
show_system_info() {
    print_status "System Information:"
    echo "  OS: $(lsb_release -d | cut -f2)"
    echo "  Kernel: $(uname -r)"
    echo "  CPU: $(nproc) cores"
    echo "  Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
    echo "  Disk: $(df -h / | tail -1 | awk '{print $2}')"
    echo "  Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo
}

# Setup complete message
show_completion_message() {
    SERVER_IP=$(curl -s ifconfig.me)

    print_success "VPS setup completed! 🎉"
    echo
    echo "📋 Next Steps:"
    echo "1. Upload your application files to /var/www/bekerjakeluarnegri"
    echo "2. Copy your .env.production file to the server"
    echo "3. Run: cd /var/www/bekerjakeluarnegri && docker compose up -d"
    echo
    echo "🌐 Your Application URLs:"
    echo "   App: http://$SERVER_IP:3211"
    echo "   Admin: http://$SERVER_IP:3211/admin"
    echo "   Health: http://$SERVER_IP:3211/api/init-db"
    echo
    echo "🔧 Useful Commands:"
    echo "   View logs: docker compose logs -f"
    echo "   Restart app: docker compose restart"
    echo "   Stop app: docker compose down"
    echo "   Update app: git pull && docker compose up -d --build"
    echo
    print_warning "Don't forget to configure your domain name and SSL certificate!"
}

# Main setup function
main() {
    echo "🚀 BekerjaLuarNegri.com VPS Setup"
    echo "================================="
    echo

    check_root

    print_status "Starting VPS setup..."

    update_system
    install_docker
    install_tools
    setup_firewall
    setup_app_directory
    setup_swap
    create_systemd_service

    show_system_info
    show_completion_message
}

# Run main function
main "$@"