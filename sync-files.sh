#!/bin/bash

# Quick File Sync Script for BekerjaLuarNegri.com
# Usage: ./sync-files.sh [vps-ip] [vps-user] [ssh-key-path]

set -e

# Configuration
VPS_IP=${1:-"YOUR_VPS_IP"}
VPS_USER=${2:-"root"}
SSH_KEY=${3:-"~/.ssh/id_rsa"}
REMOTE_DIR="/var/www/bekerjakeluarnegri"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[SYNC]${NC} $1"
}

# Sync files using rsync
sync_files() {
    print_status "Syncing files to VPS..."

    # Create exclude list
    EXCLUDE_LIST=(
        --exclude='.git'
        --exclude='node_modules'
        --exclude='.next'
        --exclude='.DS_Store'
        --exclude='*.log'
        --exclude='.claude'
        --exclude='TEMPLATE*'
        --exclude='*.docx'
        --exclude='domain no-reply.png'
        --exclude='nul'
        --exclude='deploy-*.sh'
        --exclude='.env.local'
    )

    # Sync files
    rsync -avz -e "ssh -i $SSH_KEY" \
        "${EXCLUDE_LIST[@]}" \
        ./ "$VPS_USER@$VPS_IP:$REMOTE_DIR/"

    print_success "Files synced successfully!"
}

# Restart application
restart_app() {
    print_status "Restarting application..."

    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" << EOF
cd $REMOTE_DIR
docker-compose restart app
EOF

    print_success "Application restarted!"
}

# Main function
main() {
    echo "🔄 BekerjaLuarNegri.com File Sync"
    echo "================================="
    echo "VPS: $VPS_USER@$VPS_IP"
    echo

    sync_files

    read -p "Do you want to restart the application? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_app
    fi

    print_success "Sync completed! 🎉"
    echo "App URL: http://$VPS_IP:3000"
}

main "$@"