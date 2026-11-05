// @ts-check
import { defineConfig } from 'astro/config';

// `site` is the address the site is served from. The domain must also be in
// public/CNAME so GitHub Pages serves it there. louisfreelandhaynes.com is not
// configured here: it redirects to louisfh.com at the registrar.
export default defineConfig({
  site: 'https://louisfh.com',
  base: '/',
  trailingSlash: 'ignore',
});
