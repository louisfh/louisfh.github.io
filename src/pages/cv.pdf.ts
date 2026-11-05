// Serves content/cv.pdf at /cv.pdf, so the file lives in one place and the link never changes.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const pdf = await readFile(resolve('content/cv.pdf'));
  return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
};
