// Centralized API calls for Admin Dashboard

async function jsonOrError(res) {
  let data = null;
  try { data = await res.json(); } catch (_) { /* ignore */ }
  return { ok: res.ok, status: res.status, data, error: data?.error };
}

export async function listSubmissions() {
  const res = await fetch('/api/submissions');
  return jsonOrError(res);
}

export async function getUserByEmail(email) {
  const res = await fetch('/api/admin/user-by-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return jsonOrError(res);
}

export async function verifySubmission(id) {
  const res = await fetch(`/api/submissions/${id}/verify`, { method: 'PUT' });
  return jsonOrError(res);
}

export async function generateAccount(id) {
  const res = await fetch(`/api/submissions/${id}/generate-account`, { method: 'POST' });
  return jsonOrError(res);
}

export async function deleteUser(id) {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  return jsonOrError(res);
}

export async function deleteSubmission(id) {
  const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
  return jsonOrError(res);
}

export async function syncSheets() {
  const res = await fetch('/api/sync-sheets');
  return jsonOrError(res);
}

export async function generateCv(userId, format) {
  // Returns the raw response for streaming/blob handling
  return fetch(`/api/cv/generate/${userId}?format=${format}`);
}

export async function getCredentials(submissionId) {
  const res = await fetch(`/api/admin/credentials/${submissionId}`);
  return jsonOrError(res);
}

export async function updateSubmissionField(id, field, value) {
  const res = await fetch(`/api/admin/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value })
  });
  return jsonOrError(res);
}

export async function checkExisting({ email, phone }) {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  const res = await fetch(`/api/check-existing?${params}`);
  return jsonOrError(res);
}

export async function bulkUploadCsv(file) {
  const formData = new FormData();
  formData.append('csvFile', file);
  const res = await fetch('/api/admin/bulk-upload-csv', { method: 'POST', body: formData });
  return jsonOrError(res);
}

export async function bulkCreateCandidates(payload) {
  const res = await fetch('/api/admin/bulk-upload-csv', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return jsonOrError(res);
}

export async function bulkDownloadCv({ userIds, format }) {
  // Returns raw response for blob handling
  return fetch('/api/admin/bulk-download-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, format }),
  });
}

export async function downloadCsv() {
  // raw response for blob
  return fetch('/api/admin/download-csv', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
}

export async function downloadCsvTemplate() {
  // raw response for blob
  return fetch('/api/admin/download-csv-template', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
}

export async function createSubmission(payload) {
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return jsonOrError(res);
}

// Payments
export async function listPayments(submissionId) {
  const res = await fetch(`/api/admin/submissions/${submissionId}/payments`, { method: 'GET', cache: 'no-store' });
  return jsonOrError(res);
}

export async function createPayment({ submissionId, paidAt, amountRupiah, paymentFor, proofFile }) {
  const form = new FormData();
  form.append('paid_at', paidAt);
  form.append('amount_rupiah', String(amountRupiah));
  form.append('payment_for', paymentFor);
  form.append('proof', proofFile);
  const res = await fetch(`/api/admin/submissions/${submissionId}/payments`, { method: 'POST', body: form });
  return jsonOrError(res);
}

export async function deletePayment(paymentId) {
  const res = await fetch(`/api/admin/payments/${paymentId}`, { method: 'DELETE' });
  return jsonOrError(res);
}
