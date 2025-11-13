import { z } from 'zod';
import { supabase } from './supabase-server';

const arrayOfStringsSchema = z.array(z.string().trim()).default([]);

export const jobCreateSchema = z.object({
  title: z.string().trim().min(2, 'Judul terlalu pendek'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
  jobdesk: arrayOfStringsSchema.optional(),
  qualifications: arrayOfStringsSchema.optional(),
  benefits: arrayOfStringsSchema.optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const jobUpdateSchema = jobCreateSchema.partial();

function normalizeToAscii(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
}

export function slugify(input) {
  const ascii = normalizeToAscii(input);
  return ascii.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export async function generateUniqueSlug(title) {
  const base = slugify(title);
  let slug = base || 'job';
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${base}-${suffix}`;
    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .eq('slug', candidate)
      .limit(1);
    if (error) throw new Error('Failed to check slug uniqueness');
    if (!data || data.length === 0) return candidate;
    suffix += 1;
  }
}

export async function listJobs({ status = 'published', page = 1, limit = 6 } = {}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { status: 200, body: { items: [], page, total: 0, hasMore: false } };
  }
  const offset = (page - 1) * limit;
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order(status === 'published' ? 'publishedAt' : 'updatedAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) {
    return { status: 500, body: { error: 'Failed to fetch jobs' } };
  }
  return {
    status: 200,
    body: {
      items: data || [],
      page,
      total: count ?? 0,
      hasMore: typeof count === 'number' ? offset + (data?.length || 0) < count : false,
    },
  };
}

export async function getJobBySlug(slug) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { status: 404, body: { error: 'Job not found' } };
  }
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) {
    return { status: 404, body: { error: 'Job not found' } };
  }
  return { status: 200, body: data };
}

export async function getJobById(id) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    return { status: 404, body: { error: 'Job not found' } };
  }
  return { status: 200, body: data };
}

export async function createJob(payload, { adminUserId } = {}) {
  const parsed = jobCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: 'Invalid payload', details: parsed.error.flatten() } };
  }
  const { title, slug, description, jobdesk = [], qualifications = [], benefits = [], status = 'draft' } = parsed.data;
  const finalSlug = slug && slug.trim().length > 0 ? slugify(slug) : await generateUniqueSlug(title);

  const now = new Date().toISOString();
  const publishedAt = status === 'published' ? now : null;

  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        title,
        slug: finalSlug,
        description,
        jobdesk,
        qualifications,
        benefits,
        status,
        publishedAt,
        createdBy: adminUserId || null,
        updatedAt: now,
      },
    ])
    .select()
    .single();

  if (error) {
    return { status: 500, body: { error: 'Failed to create job' } };
  }
  return { status: 201, body: data };
}

export async function updateJob(id, payload) {
  const parsed = jobUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: 400, body: { error: 'Invalid payload', details: parsed.error.flatten() } };
  }
  const update = { ...parsed.data };

  if (typeof update.slug === 'string') {
    update.slug = slugify(update.slug);
  }
  if (update.title && !update.slug) {
    // If title changed and slug not provided, do not auto change slug; leave as is
  }

  if (update.status === 'published') {
    update.publishedAt = new Date().toISOString();
  } else if (update.status === 'draft') {
    update.publishedAt = null;
  }

  update.updatedAt = new Date().toISOString();

  // If slug provided, ensure unique (except current id)
  if (update.slug) {
    const { data: exists, error: checkError } = await supabase
      .from('jobs')
      .select('id')
      .eq('slug', update.slug)
      .neq('id', id)
      .limit(1);
    if (checkError) return { status: 500, body: { error: 'Failed to validate slug' } };
    if (exists && exists.length > 0) return { status: 409, body: { error: 'Slug already in use' } };
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { status: 500, body: { error: 'Failed to update job' } };
  }
  return { status: 200, body: data };
}

export async function deleteJob(id) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) {
    return { status: 500, body: { error: 'Failed to delete job' } };
  }
  return { status: 200, body: { success: true } };
}

// Admin list with server-side pagination and sorting
export async function adminListJobs({ page = 1, limit = 20, sortBy = 'updatedAt', sortDir = 'desc', status, search } = {}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { status: 200, body: { items: [], page, total: 0, hasMore: false } };
  }
  const validSorts = new Set(['title', 'status', 'publishedAt', 'updatedAt', 'createdAt']);
  const orderCol = validSorts.has(sortBy) ? sortBy : 'updatedAt';
  const ascending = String(sortDir).toLowerCase() === 'asc';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order(orderCol, { ascending })
    .range(offset, offset + limit - 1);

  if (status && (status === 'draft' || status === 'published')) {
    query = query.eq('status', status);
  }
  if (search && typeof search === 'string' && search.trim().length > 0) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return { status: 500, body: { error: 'Failed to fetch jobs' } };
  }
  return {
    status: 200,
    body: {
      items: data || [],
      page,
      total: count ?? 0,
      hasMore: typeof count === 'number' ? offset + (data?.length || 0) < count : false,
    },
  };
}
