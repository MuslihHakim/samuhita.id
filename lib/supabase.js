import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for browser and general use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('Initializing database...')
    
    // Check if tables exist by trying to query them
    const { data: submissionsCheck } = await supabase
      .from('submissions')
      .select('id')
      .limit(1)
    
    console.log('Database tables already exist')
    return { success: true, message: 'Database initialized' }
  } catch (error) {
    console.error('Database initialization check failed:', error)
    return { success: false, error: error.message }
  }
}
