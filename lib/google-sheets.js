import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Validate required environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.join(process.cwd(), 'google-credentials.json');

if (!SHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID environment variable is required');
}

if (!CREDENTIALS_PATH) {
  throw new Error('GOOGLE_CREDENTIALS_PATH environment variable is required');
}

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  try {
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Google credentials file not found at: ${CREDENTIALS_PATH}`);
    }

    // Read and validate credentials file
    const credentialsContent = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    let credentials;

    try {
      credentials = JSON.parse(credentialsContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON in credentials file: ${parseError.message}`);
    }

    // Validate required credential fields
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid credentials format: missing client_email or private_key');
    }

    console.log('Initializing Google Sheets client with service account:', credentials.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw new Error(`Google Sheets authentication failed: ${error.message}`);
  }
}

// Find the first empty row in the sheet
async function findFirstEmptyRow() {
  try {
    const sheets = getGoogleSheetsClient();

    // Read column A to find first empty cell (start from row 2, after header)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:A', // Get all of column A
    });

    const rows = response.data.values || [];
    console.log(`Checking ${rows.length} rows to find first empty row`);

    // Start from row 2 (after header)
    for (let row = 1; row < rows.length; row++) { // row index 1 = actual row 2
      if (!rows[row] || rows[row][0] === '' || !rows[row][0]) {
        console.log(`Found first empty row: ${row + 1}`);
        return row + 1; // +1 because sheets are 1-indexed
      }
    }

    // If no empty rows found, use next row
    const nextRow = rows.length + 1;
    console.log(`No empty rows found, using next row: ${nextRow}`);
    return nextRow;
  } catch (error) {
    console.error('Error finding first empty row:', error);
    // Default to row 2 if there's an error
    return 2;
  }
}

// Add data to Google Sheet
export async function addToGoogleSheet(data) {
  const maxRetries = 3;
  let lastError;

  // Validate input data
  const { fullName, email, phoneNumber } = data;
  if (!fullName || !email || !phoneNumber) {
    return {
      success: false,
      error: 'Missing required data: fullName, email, and phoneNumber are required'
    };
  }

  console.log('Attempting to sync data to Google Sheets:', { fullName, email, phoneNumber: phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') });

  // Find the first empty row
  const targetRow = await findFirstEmptyRow();
  console.log(`Will write to row ${targetRow}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sheets = getGoogleSheetsClient();

      // Write to specific row instead of appending
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!A${targetRow}:D${targetRow}`, // Specific row
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[fullName, email, phoneNumber, ""]], // Empty string for unchecked checkbox
        },
      });

      console.log(`✓ Data synced to Google Sheets (attempt ${attempt}):`, {
        spreadsheetId: SHEET_ID,
        updatedCells: response.data.updatedCells,
        updatedRange: response.data.updatedRange,
        row: targetRow
      });

      return {
        success: true,
        message: `Data synced to Google Sheets successfully (Row ${targetRow})`,
        attempt: attempt,
        row: targetRow
      };

    } catch (error) {
      lastError = error;
      console.error(`Google Sheets sync error (attempt ${attempt}/${maxRetries}):`, {
        message: error.message,
        code: error.code,
        status: error.status,
        sheetId: SHEET_ID
      });

      // Don't retry on authentication errors or permission denied
      if (error.code === 401 || error.code === 403 || error.status === 403) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Provide specific error messages for common issues
  let errorMessage = lastError.message;
  if (lastError.code === 403 || lastError.status === 403) {
    errorMessage = `Permission denied. Please ensure the Google Sheet is shared with the service account email: cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com`;
  } else if (lastError.code === 404) {
    errorMessage = `Google Sheet not found. Please check the SHEET_ID: ${SHEET_ID}`;
  }

  return {
    success: false,
    error: errorMessage,
    originalError: lastError.message,
    attempts: maxRetries
  };
}

// Read verification status from Google Sheet
export async function syncVerificationFromSheet() {
  try {
    console.log('Reading verification data from Google Sheets...');
    const sheets = getGoogleSheetsClient();

    // Read all data from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D', // Name, Email, Phone, Verified
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in Google Sheets');
      return { success: true, data: [] };
    }

    console.log(`Found ${rows.length} rows in Google Sheets (including header)`);

    // Validate header row
    if (rows.length > 0) {
      const header = rows[0];
      if (header.length < 4) {
        return {
          success: false,
          error: 'Google Sheets format error: Expected at least 4 columns (Name, Email, Phone, Verified)'
        };
      }
    }

    // Skip header row and format data
    const verifications = rows.slice(1).map((row, index) => {
      const verification = {
        rowNumber: index + 2, // +2 because of header and 0-index
        fullName: row[0] || '',
        email: row[1] || '',
        phoneNumber: row[2] || '',
        verified: false
      };

      // Better verification status detection
      if (row[3]) {
        const verifiedValue = String(row[3]).toLowerCase().trim();
        verification.verified = verifiedValue === 'true' || verifiedValue === 'yes' || verifiedValue === '1' || verifiedValue === 'checked';
      }

      return verification;
    }).filter(row => row.email); // Only include rows with email

    const verifiedCount = verifications.filter(v => v.verified).length;
    console.log(`Processed ${verifications.length} valid entries, ${verifiedCount} verified`);

    return {
      success: true,
      data: verifications,
      summary: {
        total: verifications.length,
        verified: verifiedCount,
        pending: verifications.length - verifiedCount
      }
    };
  } catch (error) {
    console.error('Error reading from Google Sheets:', {
      message: error.message,
      code: error.code,
      status: error.status,
      sheetId: SHEET_ID
    });

    // Provide specific error messages
    let errorMessage = error.message;
    if (error.code === 403 || error.status === 403) {
      errorMessage = `Permission denied reading from Google Sheets. Please ensure the Google Sheet is shared with: cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com`;
    } else if (error.code === 404) {
      errorMessage = `Google Sheet not found. Please check the SHEET_ID: ${SHEET_ID}`;
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error.message
    };
  }
}

// Test Google Sheets connection
export async function testGoogleSheetsConnection() {
  try {
    console.log('Testing Google Sheets connection...');

    const sheets = getGoogleSheetsClient();

    // Test read access
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:D1', // Just read header row
    });

    console.log('✓ Google Sheets connection successful');
    return {
      success: true,
      message: 'Google Sheets connection working properly',
      sheetId: SHEET_ID,
      headerRow: response.data.values?.[0] || []
    };
  } catch (error) {
    console.error('Google Sheets connection test failed:', error);

    let errorMessage = error.message;
    if (error.code === 403 || error.status === 403) {
      errorMessage = `Permission denied. Please ensure the Google Sheet is shared with: cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com`;
    } else if (error.code === 404) {
      errorMessage = `Google Sheet not found. Please check the SHEET_ID: ${SHEET_ID}`;
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error.message,
      sheetId: SHEET_ID
    };
  }
}

// Update verification status in sheet (when verified in system)
export async function updateVerificationInSheet(email, verified = true) {
  try {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    console.log(`Updating verification status for ${email} to ${verified}`);
    const sheets = getGoogleSheetsClient();

    // First, find the row with this email
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D',
    });

    const rows = readResponse.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: 'No data in sheet' };
    }

    // Find row index (skip header)
    const rowIndex = rows.findIndex((row, index) => index > 0 && row[1] === email);

    if (rowIndex === -1) {
      return { success: false, error: `Email ${email} not found in sheet` };
    }

    // Update verification status
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Sheet1!D${rowIndex + 1}`, // +1 for 1-based indexing
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[verified]],
      },
    });

    console.log(`✓ Verification status updated in Google Sheets for ${email}`);
    return {
      success: true,
      message: `Verification updated for ${email}`,
      row: rowIndex + 1,
      newValue: verified
    };
  } catch (error) {
    console.error('Error updating Google Sheets:', error);
    return {
      success: false,
      error: `Failed to update verification: ${error.message}`,
      email: email
    };
  }
}
