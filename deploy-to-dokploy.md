# Deployment Guide for Samuhita.id to Dokploy

## Manual Deployment Steps (via Dokploy Web Interface)

### 1. Access Dokploy Dashboard
- URL: https://appscontrol.growthsolv.com
- Login with your credentials

### 2. Create New Application
1. Navigate to "Applications"
2. Click "Add Application"
3. Select "Docker" deployment type
4. Choose "projectakhdan Projects" as the project

### 3. Configure Application Settings
- **Application Name**: `samuhita-id`
- **Repository**:
  - URL: Your Git repository URL
  - Branch: `main`
  - Root Path: `/` (or appropriate path)

### 4. Build Configuration
- **Dockerfile Path**: `./Dockerfile`
- **Build Context**: `.`

### 5. Environment Variables
Copy these from `.env.production`:
```
NODE_ENV=production
PORT=3211
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://erdtyrhjktnewrvyuwqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZHR5cmhqa3RuZXdydnl1d3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzE5NTMsImV4cCI6MjA3NTU0Nzk1M30.m80Xx_YLqFp3VHpfc4ySDnrpHQYizdAP1awOJp-ZgIw
SUPABASE_SERVICE_ROLE_KEY=sb_secret_4VSQdGydDDQg7UlT5XyVow_g3ZybrkJ
RESEND_API_KEY=re_9Z4bEPgS_4S8Lyaq47fUvjPe4dS5kL8jU
GOOGLE_SHEET_ID=1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s
CORS_ORIGINS=*
```

### 6. Port Configuration
- **Internal Port**: `3211`
- **External Port**: As assigned by Dokploy (usually automatic)

### 7. Health Check
- **Health Check Path**: `/` or `/api/health` (if available)
- **Port**: `3211`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

### 8. Deployment
- Click "Deploy" to start the deployment process
- Monitor the deployment logs
- Wait for the deployment to complete

### 9. Post-Deployment Verification
1. **Application Health**: Check if the app is running on the assigned URL
2. **Database Connection**: Verify Supabase connectivity
3. **Email Service**: Test Resend email functionality
4. **Google Sheets**: Test Google Sheets integration
5. **File Uploads**: Verify photo uploads to Supabase Storage

## Application Details
- **Framework**: Next.js 14.2.3 with standalone output
- **Runtime**: Node.js 18 Alpine
- **Port**: 3211 (non-conventional for security)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Authentication**: Custom admin system

## Notes
- The Dockerfile is optimized for production with multi-stage build
- All environment variables are configured for production use
- Port 3211 is used to avoid conflicts with other applications
- CORS is configured to allow all origins (adjust as needed for production)
