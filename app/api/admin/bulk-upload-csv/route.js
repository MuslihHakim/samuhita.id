import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { professionOptions } from '../../../../lib/constants/professions';
import { addedByOptions, sentToOptions } from '../../../../lib/constants/submissionOptions';
import { getCoordinatorOptions } from '../../../../lib/constants/coordinators';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const header = parseCSVLine(lines[0]);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === header.length) {
      const row = {};
      header.forEach((col, index) => {
        row[col] = values[index] || '';
      });
      data.push(row);
    }
  }

  return { header, data };
}

// Helper function to parse CSV line (handles quotes and commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone number
function isValidPhone(phone) {
  // Basic phone validation - can be enhanced based on requirements
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Helper function to validate date
function isValidDate(dateString) {
  if (!dateString) return true; // Optional field
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Helper function to escape CSV values (reuse from download-csv)
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const csvFile = formData.get('csvFile');

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvText = await csvFile.text();

    // Parse CSV
    let parsedData;
    try {
      parsedData = parseCSV(csvText);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file: ' + parseError.message },
        { status: 400 }
      );
    }

    const { header, data } = parsedData;

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'CSV file contains no data rows' },
        { status: 400 }
      );
    }

    // Expected columns based on CSV template
    const requiredColumns = ['Full Name', 'Email', 'Phone Number'];
    const optionalColumns = [
      'Profession',
      'Position Apply', // backward-compatible alias
      'Gender',
      'Add By',
      'Coordinator',
      'Sent To',
      'CV Name',
      'Father Name',
      'Mother Name',
      'Height',
      'Weight',
      'Marital Status',
      'Place of Birth',
      'Date of Birth',
      'Address',
      'Religion',
      'Citizenship',
      'Passport Number',
      'Passport Issued By',
      'Passport Issue Date',
      'Passport Expiry Date',
      'Mobile Number',
      'Email (CV)',
      'Emergency Contact Name',
      'Emergency Contact Number',
      'Emergency Contact Relation',
      'Emergency Contact Address'
    ];

    // Validate required columns exist
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required columns in CSV',
          missingColumns,
          requiredColumns
        },
        { status: 400 }
      );
    }

    // Get existing submissions for duplicate checking
    const { data: existingSubmissions, error: fetchError } = await supabase
      .from('submissions')
      .select('email, phoneNumber, fullName');

    if (fetchError) {
      console.error('Error fetching existing submissions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to validate duplicates' },
        { status: 500 }
      );
    }

    const existingEmails = new Set(existingSubmissions.map(s => s.email.toLowerCase()));
    const existingPhones = new Set(existingSubmissions.map(s => s.phoneNumber));

    // Process and validate each row
    const processedCandidates = [];
    const validationErrors = [];
    const duplicates = [];

    // Utility: normalize by options (case-insensitive). Unknown -> '' (unassigned)
    const normalizeByOptions = (value, options) => {
      if (!value) return '';
      const lower = String(value).trim().toLowerCase();
      const match = options.find((opt) => opt.toLowerCase() === lower);
      return match || '';
    };

    // Gender normalization (Male/Female only). Unknown -> invalid
    const normalizeGender = (value) => {
      if (!value) return '';
      const v = String(value).trim().toLowerCase();
      if (v === 'male') return 'Male';
      if (v === 'female') return 'Female';
      return null; // signal invalid
    };

    data.forEach((row, index) => {
      const coordinatorInput = row['Coordinator']?.trim() || '';
      const candidate = {
        rowIndex: index + 2, // +2 because: header is row 1, and data starts at row 2
        fullName: row['Full Name']?.trim() || '',
        email: row['Email']?.trim() || '',
        phoneNumber: row['Phone Number']?.trim() || '',
        // Profession (with backward compat from Position Apply)
        profession: normalizeByOptions((row['Profession'] || row['Position Apply'] || '').trim(), professionOptions),
        // Gender (strict allowed set)
        gender: (row['Gender']?.trim() || ''),
        // Admin assignment
        addedBy: normalizeByOptions((row['Add By'] || '').trim(), addedByOptions),
        sentTo: normalizeByOptions((row['Sent To'] || '').trim(), sentToOptions),
        coordinator: '',
        // legacy / passthrough fields
        positionApply: row['Position Apply']?.trim() || '',
        fatherName: row['Father Name']?.trim() || '',
        motherName: row['Mother Name']?.trim() || '',
        height: row['Height']?.trim() || '',
        weight: row['Weight']?.trim() || '',
        maritalStatus: row['Marital Status']?.trim() || '',
        placeOfBirth: row['Place of Birth']?.trim() || '',
        dateOfBirth: row['Date of Birth']?.trim() || '',
        address: row['Address']?.trim() || '',
        religion: row['Religion']?.trim() || '',
        citizenship: row['Citizenship']?.trim() || '',
        passportNumber: row['Passport Number']?.trim() || '',
        passportIssuedBy: row['Passport Issued By']?.trim() || '',
        passportIssueDate: row['Passport Issue Date']?.trim() || '',
        passportExpiryDate: row['Passport Expiry Date']?.trim() || '',
        mobileNumber: row['Mobile Number']?.trim() || '',
        emailCV: row['Email (CV)']?.trim() || '',
        emergencyContactName: row['Emergency Contact Name']?.trim() || '',
        emergencyContactNumber: row['Emergency Contact Number']?.trim() || '',
        emergencyContactRelation: row['Emergency Contact Relation']?.trim() || '',
        emergencyContactAddress: row['Emergency Contact Address']?.trim() || ''
      };

      // Validation
      const errors = [];

      // Required fields
      if (!candidate.fullName) errors.push('Full Name is required');
      if (!candidate.email) errors.push('Email is required');
      if (!candidate.phoneNumber) errors.push('Phone Number is required');

      // Format validation
      if (candidate.email && !isValidEmail(candidate.email)) {
        errors.push('Invalid email format');
      }

      if (candidate.phoneNumber && !isValidPhone(candidate.phoneNumber)) {
        errors.push('Invalid phone number format');
      }

      // Coordinator validation (depends on Add By)
      const coordinatorOptions = getCoordinatorOptions(candidate.addedBy);
      if (coordinatorOptions.length > 0) {
        if (coordinatorInput) {
          if (coordinatorInput.toLowerCase() === 'unassigned') {
            candidate.coordinator = '';
          } else {
            const match = coordinatorOptions.find(
              (option) => option.toLowerCase() === coordinatorInput.toLowerCase(),
            );
            if (match) {
              candidate.coordinator = match;
            } else {
              errors.push(`Invalid Coordinator for Add By "${candidate.addedBy}"`);
            }
          }
        } else {
          candidate.coordinator = '';
        }
      } else {
        // For other Add By values, coordinator is forced to unassigned, ignore any provided value
        candidate.coordinator = '';
      }

      // Gender validation (if provided)
      if (candidate.gender) {
        const g = normalizeGender(candidate.gender);
        if (g === null) {
          errors.push('Invalid Gender: allowed values are Male/Female');
        } else {
          candidate.gender = g; // normalized case
        }
      }

      if (candidate.dateOfBirth && !isValidDate(candidate.dateOfBirth)) {
        errors.push('Invalid Date of Birth format');
      }

      if (candidate.passportIssueDate && !isValidDate(candidate.passportIssueDate)) {
        errors.push('Invalid Passport Issue Date format');
      }

      if (candidate.passportExpiryDate && !isValidDate(candidate.passportExpiryDate)) {
        errors.push('Invalid Passport Expiry Date format');
      }

      // Duplicate checking
      const isDuplicateEmail = candidate.email && existingEmails.has(candidate.email.toLowerCase());
      const isDuplicatePhone = candidate.phoneNumber && existingPhones.has(candidate.phoneNumber);

      if (isDuplicateEmail || isDuplicatePhone) {
        duplicates.push({
          rowIndex: candidate.rowIndex,
          fullName: candidate.fullName,
          email: candidate.email,
          phoneNumber: candidate.phoneNumber,
          duplicateEmail: isDuplicateEmail,
          duplicatePhone: isDuplicatePhone
        });
      }

      processedCandidates.push({
        ...candidate,
        isValid: errors.length === 0,
        errors,
        hasDuplicate: isDuplicateEmail || isDuplicatePhone,
        duplicateEmail: isDuplicateEmail,
        duplicatePhone: isDuplicatePhone
      });
    });

    // Summary statistics
    const totalCandidates = processedCandidates.length;
    const validCandidates = processedCandidates.filter(c => c.isValid && !c.hasDuplicate).length;
    const duplicateCandidates = processedCandidates.filter(c => c.hasDuplicate).length;
    const invalidCandidates = processedCandidates.filter(c => !c.isValid).length;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${totalCandidates} candidates from CSV`,
      summary: {
        total: totalCandidates,
        valid: validCandidates,
        duplicates: duplicateCandidates,
        invalid: invalidCandidates
      },
      candidates: processedCandidates,
      duplicates,
      validationErrors,
      header,
      statistics: {
        existingEmailsCount: existingEmails.size,
        existingPhonesCount: existingPhones.size
      }
    });

  } catch (error) {
    console.error('Bulk upload CSV error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// POST to actually create the candidates after review
export async function PUT(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { candidates, excludeDuplicates = true, excludeInvalid = true } = await request.json();

    if (!candidates || !Array.isArray(candidates)) {
      return NextResponse.json(
        { error: 'Candidates data is required' },
        { status: 400 }
      );
    }

    // Filter candidates based on preferences
    let candidatesToInsert = candidates;

    if (excludeDuplicates) {
      candidatesToInsert = candidatesToInsert.filter(c => !c.hasDuplicate);
    }

    if (excludeInvalid) {
      candidatesToInsert = candidatesToInsert.filter(c => c.isValid);
    }

    if (candidatesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No valid candidates to insert' },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const submissionsToInsert = candidatesToInsert.map(candidate => ({
      fullName: candidate.fullName,
      email: candidate.email,
      phoneNumber: candidate.phoneNumber,
      status: 'pending',
      // Normalize unknowns to empty string for unassigned in DB
      addedBy: candidate.addedBy || '',
      coordinator: candidate.coordinator || '',
      sentTo: candidate.sentTo || '',
      profession: candidate.profession || '',
    }));

    // Insert candidates in batches to avoid timeout
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < submissionsToInsert.length; i += batchSize) {
      const batch = submissionsToInsert.slice(i, i + batchSize);

      const { data: insertedData, error: insertError } = await supabase
        .from('submissions')
        .insert(batch)
        .select();

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: false,
          error: insertError.message,
          candidates: batch
        });
      } else {
        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: true,
          inserted: insertedData,
          candidates: batch
        });
      }
    }

    const successfulInserts = results.filter(r => r.success).flatMap(r => r.inserted);
    const failedBatches = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${successfulInserts.length} candidates`,
      summary: {
        totalRequested: candidates.length,
        filtered: candidatesToInsert.length,
        successful: successfulInserts.length,
        failed: failedBatches.length
      },
      results: {
        successful: successfulInserts,
        failed: failedBatches
      }
    });

  } catch (error) {
    console.error('Bulk create candidates error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
