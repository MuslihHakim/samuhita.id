import { NextResponse } from 'next/server';

export function ok(data, init = {}) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created(data, init = {}) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function badRequest(error, init = {}) {
  return NextResponse.json(
    normalizeErrorPayload(error),
    { status: 400, ...init },
  );
}

export function unauthorized(error = 'Unauthorized', init = {}) {
  return NextResponse.json(
    normalizeErrorPayload(error),
    { status: 401, ...init },
  );
}

export function forbidden(error = 'Forbidden', init = {}) {
  return NextResponse.json(
    normalizeErrorPayload(error),
    { status: 403, ...init },
  );
}

export function notFound(error = 'Not found', init = {}) {
  return NextResponse.json(
    normalizeErrorPayload(error),
    { status: 404, ...init },
  );
}

export function serverError(error = 'Internal server error', init = {}) {
  return NextResponse.json(
    normalizeErrorPayload(error),
    { status: 500, ...init },
  );
}

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

function normalizeErrorPayload(error) {
  if (typeof error === 'string') {
    return { error };
  }

  if (error instanceof Error) {
    return { error: error.message };
  }

  return error ?? { error: 'Unknown error' };
}
