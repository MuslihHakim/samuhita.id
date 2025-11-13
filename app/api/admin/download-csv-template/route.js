import { requireAdminSession } from '../../../../lib/auth/requireAdminSession'

export async function GET(request) {
  const session = await requireAdminSession()
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create CSV template with headers only (no data rows)
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

    // Create just the header row (no data rows)
    const csvContent = csvHeaders.join(',')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `CSV_Template_${timestamp}.csv`

    // Return CSV template file
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
    console.error('CSV template download error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
