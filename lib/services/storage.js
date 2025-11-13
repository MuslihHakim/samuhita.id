import { supabaseAdmin } from './supabase-server';

const CV_BUCKET = 'cv-photos';

export async function uploadCvAsset(path, buffer, { contentType, upsert = true } = {}) {
  return supabaseAdmin.storage.from(CV_BUCKET).upload(path, buffer, {
    contentType,
    upsert,
  });
}

export function getCvAssetPublicUrl(path) {
  return supabaseAdmin.storage.from(CV_BUCKET).getPublicUrl(path);
}

export async function listCvAssets(folder) {
  return supabaseAdmin.storage.from(CV_BUCKET).list(folder);
}

export async function removeCvAssets(paths) {
  return supabaseAdmin.storage.from(CV_BUCKET).remove(paths);
}
