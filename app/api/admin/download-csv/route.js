import { createClient } from '@supabase/supabase-js'
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const session = await requireAdminSession()
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all submissions with their data
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .order('createdAt', { ascending: false })

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch submissions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // For registered users, get their CV data
    const submissionsWithCV = await Promise.all(
      submissions.map(async (submission) => {
        let cvData = null

        if (submission.status === 'registered') {
          try {
            // Get user ID from Supabase Auth using email
            const { data: users } = await supabase.auth.admin.listUsers()
            const authUser = users.users.find(u => u.email === submission.email)

            if (authUser) {
              const { data: cv } = await supabase
                .from('cv_data')
                .select('*')
                .eq('userId', authUser.id)
                .single()

              cvData = cv
            }
          } catch (error) {
            console.warn('Could not fetch CV data for:', submission.email, error)
          }
        }

        return {
          ...submission,
          cvData
        }
      })
    )

    // Create CSV content
    const csvHeaders = [
      'No',
      'Full Name',
      'Email',
      'Phone Number',
      'Status',
      'Registration Date',
      'Placement',
      'Add By',
      'Coordinator',
      'Sent To',
      // Personal Details from CV
      'Profession',
      'Gender',
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
      // Emergency Contact
      'Emergency Contact Name',
      'Emergency Contact Number',
      'Emergency Contact Relation',
      'Emergency Contact Address'
    ]

    const csvRows = submissionsWithCV.map((submission, index) => {
      const cv = submission.cvData || {}

      const profession = submission.profession || cv.profession || cv.positionApply || ''
      const gender = cv.gender || ''

      return [
        index + 1,
        escapeCsvValue(submission.fullName || ''),
        escapeCsvValue(submission.email || ''),
        escapeCsvValue(submission.phoneNumber || ''),
        submission.status || '',
        submission.createdAt ? new Date(submission.createdAt).toLocaleDateString('en-US') : '',
        escapeCsvValue(submission.placement || ''),
        escapeCsvValue(submission.addedBy || ''),
        escapeCsvValue(submission.coordinator || ''),
        escapeCsvValue(submission.sentTo || ''),
        // CV Personal Details
        escapeCsvValue(profession),
        escapeCsvValue(gender),
        escapeCsvValue(cv.name || ''),
        escapeCsvValue(cv.fatherName || ''),
        escapeCsvValue(cv.motherName || ''),
        escapeCsvValue(cv.height || ''),
        escapeCsvValue(cv.weight || ''),
        escapeCsvValue(cv.maritalStatus || ''),
        escapeCsvValue(cv.placeOfBirth || ''),
        cv.dateOfBirth || '',
        escapeCsvValue(cv.address || ''),
        escapeCsvValue(cv.religion || ''),
        escapeCsvValue(cv.citizenship || ''),
        escapeCsvValue(cv.idnPassportNo || ''),
        escapeCsvValue(cv.issuedBy || ''),
        cv.issueDate || '',
        cv.expDate || '',
        escapeCsvValue(cv.mobileNo || ''),
        escapeCsvValue(cv.email || ''),
        // Emergency Contact
        escapeCsvValue(cv.emergencyContactName || ''),
        escapeCsvValue(cv.emergencyContactNumber || ''),
        escapeCsvValue(cv.emergencyContactRelation || ''),
        escapeCsvValue(cv.emergencyContactAddress || '')
      ]
    })

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `User_Data_Export_${timestamp}.csv`

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error('CSV export error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Helper function to escape CSV values
function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''

  // Convert to string
  const stringValue = String(value)

  // If the value contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}
