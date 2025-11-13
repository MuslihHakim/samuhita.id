import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET method to fetch process data for a user
export async function GET(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = params;

    // Validate userId
    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch process data
    const { data, error } = await supabase
      .from('process_data')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch process data' },
        { status: 500 }
      );
    }

    // Return empty structure if no data exists
    if (!data) {
      const emptyData = {
        userId,
        prescreen_tanggal: null,
        prescreen_interviewer: '',
        prescreen_bahasa_inggris: '',
        prescreen_finansial: '',
        mcu_tanggal: null,
        mcu_status: '',
        mcu_note: '',
        mcu_document_url: '',
        interview_tanggal: null,
        interview_score_bahasa: '',
        interview_score_keahlian: '',
        interview_status: '',
        visa_tanggal_terbit: null,
        visa_lokasi_penerbitan: '',
        visa_no_referensi: '',
        visa_document_url: '',
        keberangkatan_tanggal: null,
        keberangkatan_bandara_asal: '',
        keberangkatan_bandara_tujuan: '',
        keberangkatan_no_tiket: '',
        contract_approval_date: null,
        contract_start_date: null,
        contract_end_date: null,
        contract_document_url: ''
      };
      return Response.json({ data: emptyData });
    }

    return Response.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method to create new process data
export async function POST(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = params;
    const processData = await request.json();

    // Validate userId
    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Add userId to process data
    processData.userId = userId;

    // Insert process data
    const { data, error } = await supabase
      .from('process_data')
      .insert(processData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to create process data' },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT method to update existing process data or create new one if it doesn't exist
export async function PUT(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = params;
    const processData = await request.json();

    // Validate userId
    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First, check if a record exists for this userId
    const { data: existingData, error: checkError } = await supabase
      .from('process_data')
      .select('id')
      .eq('userId', userId)
      .single();

    let result;

    if (checkError && checkError.code === 'PGRST116') {
      // No existing record, create a new one
      const insertData = {
        userId,
        ...processData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('process_data')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return Response.json(
          { error: 'Failed to create process data' },
          { status: 500 }
        );
      }

      result = data;
    } else if (checkError) {
      // Some other error occurred
      console.error('Supabase check error:', checkError);
      return Response.json(
        { error: 'Failed to check existing process data' },
        { status: 500 }
      );
    } else {
      // Record exists, update it
      const { data, error } = await supabase
        .from('process_data')
        .update({
          ...processData,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return Response.json(
          { error: 'Failed to update process data' },
          { status: 500 }
        );
      }

      if (!data) {
        return Response.json(
          { error: 'Process data not found' },
          { status: 404 }
        );
      }

      result = data;
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
