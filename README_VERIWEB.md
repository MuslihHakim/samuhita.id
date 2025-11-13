# VeriWeb - Registration & Verification System

A full-stack web application for user registration, admin verification, and CV management.

## 🚀 Features

1. **Landing Page** - User registration form
2. **Admin Dashboard** - Verify submissions and generate accounts
3. **User Dashboard** - Complete CV form with file uploads
4. **Email Notifications** - Automated credential delivery via Resend
5. **Google Sheets Integration** - Sync submissions (configured)
6. **Supabase Backend** - Authentication, database, and storage

## 📋 Application Flow

1. User submits registration (Name, Email, Phone) on landing page
2. Data saved to Supabase `submissions` table with `pending` status
3. Admin logs in and verifies submissions
4. Admin generates user account:
   - Creates user in Supabase Auth
   - Sends login credentials via email (Resend)
   - Updates status to `registered`
5. User receives email with credentials
6. User logs in and completes comprehensive CV form
7. CV data saved to Supabase database

## 🛠️ Setup Instructions

### 1. Initial Setup

Visit the setup page to initialize your application:
```
http://localhost:3000/setup
```

or visit the live URL:
```
https://veriweb.preview.emergentagent.com/setup
```

### 2. Database Initialization

1. Go to setup page and click "Get SQL Script"
2. Copy the SQL script
3. Open Supabase SQL Editor: https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv/sql
4. Paste and run the SQL script

This will create:
- `submissions` table (registration data)
- `cv_data` table (CV information)
- `admin_users` table (admin authentication)
- `cv-photos` storage bucket (file uploads)
- All necessary policies and indexes

### 3. Create Admin Account

On the setup page:
1. Enter admin credentials:
   - Email: admin@veriweb.com
   - Username: admin
   - Password: (set your password)
2. Click "Create Admin User"

### 4. Start Using the Application

**Landing Page**: http://localhost:3000/ or https://veriweb.preview.emergentagent.com/
- Users can submit registration

**Login Page**: http://localhost:3000/login
- User login (with emailed credentials)
- Admin login (with created admin account)

**Admin Dashboard**: http://localhost:3000/admin
- View all submissions
- Verify submissions
- Generate accounts and send credentials

**User Dashboard**: http://localhost:3000/dashboard
- Complete CV form
- Upload photos
- Save CV data

## 🔐 Environment Variables (Already Configured)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://erdtyrhjktnewrvyuwqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_4VSQdGydDDQg7UlT5XyVow_g3ZybrkJ

# Resend Email Configuration
RESEND_API_KEY=re_4cKM7bWV_2upApdL1usrRqUK6nRBvsEDg

# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=AIzaSyA2n7dgVT2N1nk3tGlgIhQBosG98L_5BZ0
```

## 📊 Database Schema

### submissions Table
- `id` (UUID) - Primary key
- `createdAt` (Timestamp) - Submission time
- `fullName` (Text) - User's full name
- `email` (Text) - User's email
- `phoneNumber` (Text) - User's phone number
- `status` (Text) - pending | verified | registered
- `userId` (UUID, nullable) - Supabase Auth user ID once an account is generated

### cv_data Table
- `id` (UUID) - Primary key
- `userId` (UUID) - Reference to auth.users
- Personal details (name, father's name, mother's name, etc.)
- Emergency contact information
- Education (JSONB array)
- Work experience (JSONB array)
- Languages & skills (JSONB)
- Photo URLs

### admin_users Table
- `id` (UUID) - Primary key
- `email` (Text) - Admin email
- `username` (Text) - Admin username
- `passwordHash` (Text) - Hashed password

## 🎨 CV Form Fields

Based on the provided template, the CV form includes:

### Personal Details
- Position Apply
- Name, Father's Name, Mother's Name
- Height, Weight, Marital Status
- Place of Birth, Date of Birth
- Address, Religion, Citizenship
- IDN Passport No, Issue Date, Issued By, Exp Date
- Mobile No, Email

### Emergency Contact
- Name, Contact Number, Relation, Address

### Education Details (Multiple Entries)
- Years, Name of School, Subject/Training, Country

### Work Experience (Multiple Entries)
- Dates (From, To), End of Contract
- Employer Details
- Position Held and Details
- Reason to Leave

### Languages & Computer Skills (Multiple Entries)
- Language, Speaking, Reading, Writing levels
- Computer Skills

### Soft Skills (Checkboxes)
- Attentive listening
- Problem solving
- Create ideas and solutions
- Critical thinking
- Discipline
- Responsible
- Teamwork

### Photo Uploads
- CV Photo
- Full Body Photo
- Passport Photo
- Paklaring Photo

## 📧 Email Integration

The application uses **Resend** to send login credentials to users.

**Email template includes:**
- Welcome message
- Username (user's email)
- Generated password
- Professional HTML styling

**Sender email**: onboarding@resend.dev (Resend's test domain)
For production, verify your own domain in Resend dashboard.

## 🔒 Authentication

**Admin Authentication:**
- Separate admin_users table
- bcrypt password hashing
- Session stored in localStorage

**User Authentication:**
- Supabase Auth
- Email/password login
- Session managed by Supabase

## 📁 Project Structure

```
/app
├── app/
│   ├── api/
│   │   ├── submissions/…           # Submission CRUD + account generation
│   │   ├── auth/login/route.js     # Login endpoint
│   │   ├── cv/…                    # CV CRUD + generate
│   │   ├── upload/route.js         # File uploads
│   │   ├── init-db/route.js        # SQL helper
│   │   ├── init-admin/route.js     # Admin bootstrap
│   │   ├── test-email/route.js     # Resend smoke test
│   │   ├── sync-sheets/route.js    # Sheets sync
│   │   ├── test-google-sheets/route.js # Sheets connectivity check
│   │   └── admin/…                 # Admin helpers (credentials, users, etc.)
│   ├── page.js                     # Landing page
│   ├── login/page.js               # Login page
│   ├── admin/page.js               # Admin dashboard
│   ├── dashboard/page.js           # User CV dashboard
│   └── setup/page.js               # Setup wizard
├── lib/
│   ├── supabase.js                 # Supabase client
│   ├── resend.js                   # Email client
│   ├── auth-utils.js               # Auth utilities
│   ├── google-sheets.js            # Google Sheets integration
│   └── init-db.js                  # Database SQL script
├── components/ui/                  # shadcn/ui components
└── .env                            # Environment variables
```

## 🌐 API Endpoints

- `POST /api/submissions` - Submit registration
- `GET /api/submissions` - Get all submissions (admin)
- `PUT /api/submissions/:id/verify` - Verify submission
- `POST /api/submissions/:id/generate-account` - Generate account & send email
- `POST /api/auth/login` - Login (admin or user)
- `POST /api/cv` - Save CV data
- `GET /api/cv?userId=xxx` - Get user's CV data
- `POST /api/upload` - Upload files
- `GET /api/init-db` - Get database initialization SQL
- `POST /api/init-admin` - Create admin user

## 🎯 Quick Start Guide

1. **Initialize Database**
   - Visit /setup
   - Run SQL script in Supabase

2. **Create Admin**
   - Use setup page to create admin account

3. **Test User Flow**
   - Go to landing page
   - Submit registration
   - Login as admin
   - Verify submission
   - Generate account
   - Check email for credentials
   - Login as user
   - Complete CV form

## 🚨 Important Notes

1. **Email Domain**: Currently using Resend's test domain. For production, verify your own domain.

2. **Google Sheets**: Basic integration is set up. To fully enable:
   - Create service account in Google Cloud Console
   - Share your sheet with service account email
   - Update google-sheets.js with OAuth2 credentials

3. **File Upload**: Photos are stored in Supabase Storage bucket 'cv-photos'

4. **Security**: Admin service role key is used server-side only for account creation

## 🎨 Technologies Used

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form (ready to integrate)

## 📝 Testing Checklist

- [ ] Database tables created
- [ ] Admin user created
- [ ] User registration works
- [ ] Google Sheets sync (optional)
- [ ] Admin can verify submissions
- [ ] Account generation works
- [ ] Email sent successfully
- [ ] User can login
- [ ] CV form saves data
- [ ] File uploads work

## 🆘 Troubleshooting

**Database errors**: Make sure SQL script is run in Supabase

**Email not sending**: Check Resend API key in .env

**Login fails**: Ensure admin user is created

**File upload fails**: Check Supabase storage bucket exists

**API errors**: Check browser console and server logs

## 📞 Support

For issues or questions, check:
1. Supabase Dashboard: https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv
2. Resend Dashboard: https://resend.com/
3. Application logs in browser console

---

**Built with ❤️ using Next.js, Supabase, and Resend**
