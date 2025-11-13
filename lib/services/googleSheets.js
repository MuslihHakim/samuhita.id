import { supabase } from './supabase-server';
import {
  addToGoogleSheet,
  syncVerificationFromSheet,
  testGoogleSheetsConnection,
} from '../google-sheets';

export {
  addToGoogleSheet,
  syncVerificationFromSheet,
  testGoogleSheetsConnection,
};

export async function syncSheetsWithSupabase() {
  try {
    const sheetResult = await syncVerificationFromSheet();

    if (!sheetResult.success) {
      return {
        status: 500,
        body: {
          error: 'Failed to read from Google Sheets: ' + sheetResult.error,
        },
      };
    }

    const verifiedEmails = sheetResult.data
      .filter(row => row.verified && row.email)
      .map(row => row.email);

    if (verifiedEmails.length === 0) {
      return {
        status: 200,
        body: {
          success: true,
          message: 'No new verifications found in Google Sheets',
          updated: 0,
          summary: sheetResult.summary,
        },
      };
    }

    const { data, error } = await supabase
      .from('submissions')
      .update({ status: 'verified' })
      .in('email', verifiedEmails)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return {
        status: 500,
        body: { error: 'Failed to update submissions' },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: `Synced ${data?.length || 0} verifications from Google Sheets`,
        updated: data?.length || 0,
        emails: verifiedEmails,
        summary: sheetResult.summary,
      },
    };
  } catch (error) {
    console.error('Sync sheets exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function testSheetsConnectivity() {
  try {
    const result = await testGoogleSheetsConnection();

    if (result.success) {
      return {
        status: 200,
        body: {
          success: true,
          message: result.message,
          sheetId: result.sheetId,
          headerRow: result.headerRow,
        },
      };
    }

    return {
      status: 500,
      body: {
        success: false,
        error: result.error,
        sheetId: result.sheetId,
        troubleshooting: {
          checkSheetSharing:
            'Ensure Google Sheet is shared with cv-management@quick-rarity-474703-q1.iam.gserviceaccount.com',
          checkSheetId: 'Verify GOOGLE_SHEET_ID in .env.local is correct',
          checkCredentials: 'Ensure google-credentials.json file exists and is valid',
        },
      },
    };
  } catch (error) {
    console.error('Test Google Sheets exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}
