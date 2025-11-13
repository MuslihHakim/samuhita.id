import { buildCvArchive } from '../../../../../lib/services/cv';

export async function GET(request, { params }) {
  const { userId } = params ?? {};
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'pdf';

  const result = await buildCvArchive(userId, format);

  if (result.buffer) {
    return new Response(result.buffer, {
      status: result.status,
      headers: result.headers,
    });
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
