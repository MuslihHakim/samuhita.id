# Google Sheets Integration - Setup & Usage

## ✅ Konfigurasi Sudah Selesai!

### 📋 Yang Sudah Dikonfigurasi:

1. **Service Account**: `cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com`
2. **Google Sheet ID**: `1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s`
3. **Credentials File**: `/app/google-credentials.json`

---

## 🔄 Cara Kerja Integrasi

### **Flow Lengkap:**

1. **User Register di Landing Page**
   - Data disimpan ke Supabase database
   - **Data OTOMATIS masuk ke Google Sheet** (Name, Email, Phone, Verified=FALSE)

2. **Admin Verifikasi di Google Sheet**
   - Admin buka Google Sheet
   - Tick checkbox kolom "Verified" menjadi TRUE
   - Save Google Sheet

3. **Sync dari Google Sheet ke Sistem**
   - Admin masuk ke Admin Dashboard
   - Klik tombol **"🔄 Sync Google Sheets"**
   - Sistem otomatis baca Google Sheet
   - Semua yang Verified=TRUE akan auto-update status di database menjadi 'verified'

4. **Generate Account**
   - Admin klik tombol **"Generate Account"**
   - User account dibuat di Supabase Auth
   - Email dengan credentials dikirim otomatis via Resend

---

## 📊 Format Google Sheet

Sheet harus punya kolom berikut di **Sheet1**:

| Kolom A | Kolom B | Kolom C | Kolom D |
|---------|---------|---------|---------|
| Name    | Email   | Phone   | Verified |
| John Doe | john@example.com | +62812345678 | FALSE |
| Jane Smith | jane@example.com | +62898765432 | TRUE |

**Catatan:**
- Kolom D (Verified) bisa berisi: `TRUE`, `FALSE`, `true`, `false`
- Sistem hanya akan sync yang Verified = TRUE dan status masih 'pending' di database

---

## 🎯 Langkah Setup Google Sheet

### **PENTING - Share Google Sheet dengan Service Account:**

1. **Buka Google Sheet Anda:**
   https://docs.google.com/spreadsheets/d/1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s

2. **Klik tombol "Share" (pojok kanan atas)**

3. **Tambahkan email service account:**
   ```
   cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com
   ```

4. **Set permission ke "Editor"** (biar bisa baca & tulis)

5. **Klik "Share" atau "Send"**

6. **Setup nama sheet:**
   - Pastikan sheet pertama bernama **"Sheet1"** (atau ubah di code)
   - Kolom header: Name | Email | Phone | Verified

---

## 🧪 Testing Integrasi

### **Test 1: Write to Google Sheet**

1. Go to landing page: https://veriweb.preview.emergentagent.com/
2. Submit registration form
3. **Check Google Sheet** - data harus muncul otomatis!

### **Test 2: Read from Google Sheet**

1. Buka Google Sheet
2. Tick checkbox "Verified" = TRUE untuk salah satu row
3. Login as admin: https://veriweb.preview.emergentagent.com/login
4. Click "🔄 Sync Google Sheets" button
5. Check table - status harus berubah jadi 'verified'

---

## 🔧 API Endpoints

### **POST /api/submissions**
- Otomatis sync ke Google Sheet saat user register

### **GET /api/sync-sheets**
- Manual sync dari Google Sheet ke database
- Dipanggil oleh button "Sync Google Sheets" di admin dashboard

---

## ⚠️ Troubleshooting

### **Error: "Permission denied"**
- ✅ Pastikan Google Sheet sudah di-share dengan service account email
- ✅ Permission harus "Editor", bukan "Viewer"

### **Error: "Sheet not found"**
- ✅ Pastikan Sheet ID benar di .env
- ✅ Pastikan sheet name adalah "Sheet1"

### **Data tidak muncul di Google Sheet**
- ✅ Check console log untuk error messages
- ✅ Pastikan service account credentials valid
- ✅ Check format kolom sesuai (A=Name, B=Email, C=Phone, D=Verified)

### **Sync tidak update status**
- ✅ Pastikan kolom "Verified" berisi TRUE (bukan text "TRUE")
- ✅ Pastikan status di database masih 'pending'
- ✅ Check browser console & server logs

---

## 📝 Code Locations

- **Google Sheets Library**: `/app/lib/google-sheets.js`
- **Credentials**: `/app/google-credentials.json`
- **Sync Endpoint**: `/app/app/api/sync-sheets/route.js`
- **Test Endpoint**: `/app/app/api/test-google-sheets/route.js`
- **Submission API**: `/app/app/api/submissions/route.js`
- **Admin Dashboard**: `/app/app/admin/page.js`

---

## 🎉 Keuntungan Integrasi Ini

1. **Bi-directional Sync**: Data bisa masuk dan keluar
2. **Admin Friendly**: Tidak perlu login ke sistem untuk verify
3. **Real-time**: Sync kapan saja dengan satu klik
4. **Backup**: Google Sheet sebagai backup data
5. **Easy Sharing**: Bisa share Google Sheet dengan tim

---

## 📧 Support

Jika ada masalah:
1. Check server logs: `tail -f /var/log/supervisor/nextjs.out.log`
2. Check browser console untuk error messages
3. Verify Google Sheet permissions
4. Test API endpoints dengan curl

**Happy syncing! 🚀**
