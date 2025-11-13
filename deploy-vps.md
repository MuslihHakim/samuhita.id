# VPS Deployment Guide for BekerjaLuarNegri.com

## 🚀 Quick Deployment Options

### Option 1: SSH Auto-Deployment (Recommended)
⭐ **Easiest method** - One command deployment from your local machine

```bash
# Make the script executable
chmod +x deploy-ssh.sh

# Deploy to your VPS
./deploy-ssh.sh YOUR_VPS_IP root ~/.ssh/id_rsa
```

### Option 2: Manual SSH Setup
Step-by-step manual deployment if you prefer full control

### Option 3: Docker Compose (Git Clone)
Traditional method with git clone on VPS

---

## 📋 Option 1: SSH Auto-Deployment

### Prerequisites
- SSH access to your VPS
- SSH key configured for passwordless login

### Quick Start
```bash
# 1. Make scripts executable
chmod +x deploy-ssh.sh sync-files.sh remote-setup.sh

# 2. Deploy your application
./deploy-ssh.sh YOUR_VPS_IP root ~/.ssh/id_rsa

# 3. For future updates, just sync files
./sync-files.sh YOUR_VPS_IP root ~/.ssh/id_rsa
```

### What the Auto-Deploy Script Does:
- ✅ Tests SSH connection
- ✅ Sets up Docker on VPS (optional)
- ✅ Uploads application files
- ✅ Builds and starts the application
- ✅ Shows deployment status and URLs

---

## 🛠️ Option 2: Manual SSH Setup

### Step 1: Prepare VPS
```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Run the setup script
curl -sSL https://raw.githubusercontent.com/MuslihHakim/VeriWeb/main/remote-setup.sh | bash
```

### Step 2: Upload Files
From your local machine:
```bash
# Upload application files
scp -r ~/.ssh/id_rsa \
  package.json \
  Dockerfile \
  docker-compose.yml \
  .env.production \
  app/ \
  components/ \
  lib/ \
  public/ \
  styles/ \
  tailwind.config.js \
  next.config.js \
  postcss.config.js \
  root@YOUR_VPS_IP:/var/www/bekerjakeluarnegri/
```

### Step 3: Deploy on VPS
```bash
# SSH back to VPS
ssh root@YOUR_VPS_IP

# Navigate to app directory
cd /var/www/bekerjakeluarnegri

# Build and start application
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

---

## 🐳 Option 3: Docker Compose (Git Clone)

### Step 1: Setup VPS
```bash
ssh root@YOUR_VPS_IP
apt update && apt install -y docker.io docker-compose git
systemctl start docker
systemctl enable docker
```

### Step 2: Clone and Deploy
```bash
git clone https://github.com/MuslihHakim/VeriWeb.git /var/www/bekerjakeluarnegri
cd /var/www/bekerjakeluarnegri

# Copy environment variables
cp .env.production .env

# Deploy
docker-compose up -d
```

---

## 🔧 Environment Variables Required

Create `.env` file on your VPS with:
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://erdtyrhjktnewrvyuwqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_4VSQdGydDDQg7UlT5XyVow_g3ZybrkJ
RESEND_API_KEY=re_9Z4bEPgS_4S8Lyaq47fUvjPe4dS5kL8jU
GOOGLE_SHEET_ID=1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s
CORS_ORIGINS=*
```

---

## 🌐 Access Your Application

After deployment, your app will be available at:
- **Main App**: `http://YOUR_VPS_IP:3000`
- **Admin Panel**: `http://YOUR_VPS_IP:3000/admin`
- **Health Check**: `http://YOUR_VPS_IP:3000/api/init-db`

---

## 🔄 Update and Maintenance

### Quick Updates (Option 1)
```bash
# Sync updated files
./sync-files.sh YOUR_VPS_IP root ~/.ssh/id_rsa

# Or redeploy completely
./deploy-ssh.sh YOUR_VPS_IP root ~/.ssh/id_rsa
```

### Manual Updates (Option 2 & 3)
```bash
# On VPS
cd /var/www/bekerjakeluarnegri

# Option 2: Re-upload files and restart
docker-compose restart app

# Option 3: Pull latest changes
git pull
docker-compose up -d --build
```

### Useful Commands
```bash
# View logs
ssh root@YOUR_VPS_IP 'cd /var/www/bekerjakeluarnegri && docker-compose logs -f'

# Restart application
ssh root@YOUR_VPS_IP 'cd /var/www/bekerjakeluarnegri && docker-compose restart'

# Check container status
ssh root@YOUR_VPS_IP 'cd /var/www/bekerjakeluarnegri && docker-compose ps'

# Stop application
ssh root@YOUR_VPS_IP 'cd /var/www/bekerjakeluarnegri && docker-compose down'
```

---

## 🛡️ Security Considerations

- Change default SSH port from 22 to a custom port
- Use SSH keys instead of passwords
- Configure UFW firewall (setup automatically in remote-setup.sh)
- Set up SSL certificate with Let's Encrypt for production
- Regular updates: `apt update && apt upgrade -y`

---

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if port is open
   sudo ufw status
   sudo ufw allow 3000/tcp
   ```

2. **Container won't start**
   ```bash
   # Check logs
   docker-compose logs app

   # Check disk space
   df -h
   ```

3. **Memory issues**
   ```bash
   # Add swap if needed
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Health Check
Always verify deployment with:
```bash
curl http://YOUR_VPS_IP:3000/api/init-db
```

---

## ✨ Features

- ✅ **Port 3000**: Standard port for VPS deployment
- ✅ **Node.js 18 Compatible**: No engine warnings
- ✅ **Auto-restart**: Docker restart policy for reliability
- ✅ **Health Monitoring**: Built-in health checks
- ✅ **Easy Updates**: Simple file sync and redeploy
- ✅ **Production Ready**: Optimized for performance

---

## 📞 Support

If you encounter issues:
1. Check the application logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure Docker is running: `systemctl status docker`
4. Check available disk space: `df -h`