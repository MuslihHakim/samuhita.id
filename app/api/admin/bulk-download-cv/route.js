import { createClient } from '@supabase/supabase-js'
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession'
import { generateWordCV, generateWordCVEasy, generatePDFCV, extractAndProcessImages, generateCVFileName } from '../../../../lib/cv-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const session = await requireAdminSession()
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userIds, format } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'User IDs are required' }, { status: 400 })
    }

    if (!format || !['word', 'pdf'].includes(format)) {
      return Response.json({ error: 'Format must be word or pdf' }, { status: 400 })
    }

    // Get user data and CV data for all users
    const { data: users, error: usersError } = await supabase
      .from('cv_data')
      .select('*')
      .in('userId', userIds)

    if (usersError) {
      console.error('Error fetching user CV data:', usersError)
      return Response.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return Response.json({ error: 'No users found with CV data' }, { status: 404 })
    }

    // Create the main ZIP file
    const JSZip = await import('jszip')
    const mainZip = new JSZip.default()

    // Generate individual ZIP files for each user
    for (const user of users) {
      try {
        // Get user info for filename
        let userName = user.name || 'Unknown'
        let userPhone = user.mobileNo || '0000000000'

        // Try to get better user info from auth
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(user.userId)
          if (userData?.user?.user_metadata?.username) {
            userName = userData.user.user_metadata.username
          }
          if (userData?.user?.user_metadata?.phone_number) {
            userPhone = userData.user.user_metadata.phone_number
          }
        } catch (userError) {
          console.warn('Could not fetch user metadata:', userError)
        }

        // Create individual user ZIP
        const userZip = new JSZip.default()

        // Generate CV document (text only)
        let cvBuffer
        if (format === 'word') {
          const docEngine = (process.env.CV_DOC_ENGINE || 'docx-templates').toLowerCase()
          const noFallback = String(process.env.CV_NO_FALLBACK || 'false').toLowerCase() === 'true'
          try {
            if (docEngine === 'easy') {
              cvBuffer = await generateWordCVEasy(user)
            } else {
              cvBuffer = await generateWordCV(user)
            }
          } catch (err) {
            console.error('Word generation error (engine=' + docEngine + '):', err)
            if (docEngine === 'easy' && !noFallback) {
              cvBuffer = await generateWordCV(user)
            } else {
              continue
            }
          }
        } else if (format === 'pdf') {
          cvBuffer = await generatePDFCV(user)
        } else {
          console.error(`Unsupported format: ${format}`)
          continue
        }

        // Generate CV filename
        const cvFileName = generateCVFileName(userName, userPhone, format === 'word' ? 'docx' : 'pdf')

        // Add CV document to user ZIP
        userZip.file(cvFileName, cvBuffer)

        // Extract and process images
        const imageFiles = await extractAndProcessImages(user, userName, userPhone)

        // Add each image to the user ZIP
        for (const imageFile of imageFiles) {
          // Use the extension detected by addImageToZip function
          const extension = imageFile.extension || '.jpg'
          userZip.file(`${imageFile.fileName}${extension}`, imageFile.buffer)
        }

        // Generate the individual user ZIP
        const userZipBuffer = await userZip.generateAsync({ type: 'nodebuffer' })

        // Add the user ZIP to the main ZIP with a clean name
        const userZipName = `${userName.replace(/[^a-zA-Z0-9\-_]/g, '_')}_${userPhone.replace(/[^a-zA-Z0-9\-_]/g, '_')}.zip`
        mainZip.file(userZipName, userZipBuffer)

        console.log(`Generated ZIP for ${userName} with CV and ${imageFiles.length} images`)
      } catch (error) {
        console.error(`Error generating CV for user ${user.userId}:`, error)
        continue
      }
    }

    // Generate the main zip file
    const mainZipBuffer = await mainZip.generateAsync({ type: 'nodebuffer' })

    // Set appropriate headers
    const filename = `Bulk_CVs_${format.toUpperCase()}_${new Date().toISOString().split('T')[0]}.zip`

    return new Response(mainZipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Bulk download error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
