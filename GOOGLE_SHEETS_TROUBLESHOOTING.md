# Google Sheets Integration - Setup & Troubleshooting Guide

## ✅ Changes Made

### 1. Environment Configuration
- ✅ Added Google Sheets environment variables to `.env.local`
- ✅ Updated Google Sheets library to use environment variables
- ✅ Added environment variable validation

### 2. Enhanced Error Handling
- ✅ Added comprehensive error handling for API calls
- ✅ Implemented retry logic with exponential backoff
- ✅ Added specific error messages for common issues
- ✅ Improved logging for debugging

### 3. New Test Endpoint
- ✅ Added `/api/test-google-sheets` endpoint for connection testing
- ✅ Enhanced sync endpoint with better error reporting
- ✅ Added troubleshooting information in error responses

## 🔧 Setup Instructions

### Step 1: Verify Google Sheet Sharing
**CRITICAL**: Ensure your Google Sheet is shared with the service account:

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s

2. Click **"Share"** in the top right corner

3. Add the service account email:
   ```
   cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com
   ```

4. Set permission to **"Editor"**

5. Click **"Send"**

### Step 2: Verify Sheet Format
Ensure your Google Sheet has the correct format:

- Sheet name must be: **"Sheet1"**
- Columns must be in order: **A=Name, B=Email, C=Phone, D=Verified**
- Header row should contain: Name, Email, Phone, Verified

Example:
| Name | Email | Phone | Verified |
|------|-------|-------|----------|
| John Doe | john@example.com | +62812345678 | FALSE |

### Step 3: Test the Connection

1. **Test API Connection**:
   ```bash
   curl http://localhost:3000/api/test-google-sheets
   ```

2. **Expected Success Response**:
   ```json
   {
     "success": true,
     "message": "Google Sheets connection working properly",
     "sheetId": "1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s",
     "headerRow": ["Name", "Email", "Phone", "Verified"]
   }
   ```

3. **Expected Error Response** (if not shared):
   ```json
   {
     "success": false,
     "error": "Permission denied. Please ensure the Google Sheet is shared with: cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com",
     "troubleshooting": {
       "checkSheetSharing": "Ensure Google Sheet is shared with cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com",
       "checkSheetId": "Verify GOOGLE_SHEET_ID in .env.local is correct",
       "checkCredentials": "Ensure google-credentials.json file exists and is valid"
     }
   }
   ```

## 🔄 Testing the Complete Flow

### 1. User Registration → Google Sheets
1. Go to the landing page
2. Submit a registration form
3. Check the Google Sheet - data should appear automatically
4. Check browser console for success/error messages

### 2. Google Sheets → Admin Sync
1. In Google Sheets, change "Verified" column to "TRUE" for any row
2. Go to Admin Dashboard
3. Click "🔄 Sync Google Sheets" button
4. Check if the submission status changes to "verified"

## 🚨 Common Issues & Solutions

### Issue: "Permission denied"
**Cause**: Google Sheet not shared with service account
**Solution**:
1. Share the sheet with `cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com`
2. Set permission to "Editor"
3. Wait a few minutes for permissions to propagate

### Issue: "Google Sheet not found"
**Cause**: Incorrect SHEET_ID
**Solution**:
1. Verify the SHEET_ID in `.env.local` matches your sheet
2. Check if the sheet URL contains the same ID

### Issue: "Invalid credentials format"
**Cause**: Corrupted or invalid `google-credentials.json`
**Solution**:
1. Ensure the credentials file exists and is valid JSON
2. Check if client_email and private_key are present

### Issue: Data not appearing in Google Sheets
**Cause**: API call failing silently
**Solution**:
1. Check browser console for error messages
2. Test the connection via `/api/test-google-sheets`
3. Check server logs for detailed error information

## 🔍 Debugging Tools

### 1. Connection Test
```bash
curl http://localhost:3000/api/test-google-sheets
```

### 2. Check Environment Variables
```bash
# Check if .env.local contains the required variables
cat .env.local | grep GOOGLE
```

### 3. Verify Credentials File
```bash
# Check if credentials file exists and is valid JSON
ls -la google-credentials.json
cat google-credentials.json | jq .
```

### 4. Test Sync Function
```bash
curl http://localhost:3000/api/sync-sheets
```

## 📁 Files Modified

1. **`.env.local`** - Added Google Sheets environment variables
2. **`lib/google-sheets.js`** - Enhanced with better error handling and retry logic
3. **`app/api/sync-sheets/route.js`** & **`app/api/test-google-sheets/route.js`** - Dedicated sync and test endpoints

## 🎯 Next Steps

1. **Test the connection** using the test endpoint
2. **Verify Google Sheet sharing** with the service account
3. **Test user registration** to confirm data sync works
4. **Test admin sync** to confirm verification works
5. **Monitor logs** for any errors in production

## 📞 Support

If issues persist:
1. Check browser console for JavaScript errors
2. Check server logs for detailed error messages
3. Verify all setup steps are completed correctly
4. Test with the provided debugging tools

## 🎉 Success Indicators

- ✅ `/api/test-google-sheets` returns success
- ✅ User registrations appear in Google Sheets
- ✅ Admin sync updates submission statuses
- ✅ No error messages in console
- ✅ Proper error handling for edge cases
