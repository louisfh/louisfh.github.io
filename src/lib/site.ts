import { getEntry } from 'astro:content';

/** The single bio entry; every page reads the profile from here. */
export async function getProfile() {
  const entry = await getEntry('bio', 'bio');
  if (!entry) throw new Error('content/bio.md is missing.');
  return entry;
}

/** Prefix a site path with the configured base, e.g. '/cv' → '/repo/cv'. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}
