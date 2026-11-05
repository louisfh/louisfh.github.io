// @ts-check
import { defineConfig } from 'astro/config';

// `site` is the address the site is served from. For a repo named
// <username>.github.io leave `base` as '/'. For any other repo name, set
// `base` to '/<repo-name>'. With a custom domain, put the domain in `site`.
export default defineConfig({
  site: 'https://louisfh.github.io',
  base: '/',
  trailingSlash: 'ignore',
});
