# Personal academic website

A small static site built with [Astro](https://astro.build) and published to GitHub Pages.
It has four pages: Home, Publications, CV and Contact. It has no analytics or tracking. The only
JavaScript is a few hundred bytes that power the light/dark toggle.

**All your content lives in `content/`.** You should rarely need to touch anything else.

| File | What it controls |
| --- | --- |
| `content/bio.md` | Name, title, photo alt text, links, research interests, office address, and the bio text |
| `content/headshot.jpg` | Your photo (resized automatically at build time) |
| `content/cv.pdf` | Your CV, served at `/cv.pdf` |
| `content/publications.bib` | Your publications, listed on the Publications page |

## Update your bio

Open `content/bio.md`. It has two parts:

1. **Frontmatter** is the block between the two `---` lines at the top. It holds structured
   fields: `name`, `position`, `affiliation`, `email`, `photoAlt`, `interests`, `links`,
   `office`, and so on. The comments in the file explain each one. To add a link (Google
   Scholar, ORCID, Bluesky, …), add an item under `links:`:

   ```yaml
   links:
     - label: Google Scholar
       url: https://scholar.google.com/citations?user=XXXXXXX
   ```

   GitHub, Google Scholar and ORCID links get their own icons; anything else gets a generic
   link icon.

2. **Body** is everything after the second `---`. It is your bio in ordinary Markdown.

To change the photo, replace `content/headshot.jpg` (keep the name, or update `photo:` in
the frontmatter). A square crop of at least 720 × 720 px looks best. Update `photoAlt`
if the new photo shows something different.

To update the CV, replace `content/cv.pdf`.

## Add a publication

Paste the BibTeX entry into `content/publications.bib`. Most journals and Google Scholar
offer a "Cite → BibTeX" export, as does Zotero.

```bibtex
@article{smith2026bats,
  author  = {Smith, Jane and Freeland-Haynes, Louis},
  title   = {Title exactly as you want it shown},
  journal = {Ecology Letters},
  year    = {2026},
  volume  = {29},
  pages   = {1--12},
  doi     = {10.1111/ele.00000},
  code    = {https://github.com/you/repo},
}
```

- Entries are grouped by year, newest first. A non-numeric year such as `{In press}` or
  `{Submitted}` is listed above all numbered years.
- Titles are shown exactly as written. LaTeX accents (`M{\"u}ller`) and `\textit{...}` work.
- Your name is shown in bold wherever the author's surname matches one listed under
  `publicationNames` in `bio.md`.
- These optional fields become link buttons: `doi`, `url`, `pdf`, `preprint`, `code`, `data`.
  They must be full `https://` links (except `doi`, which is just the DOI). `url` is only
  shown when there is no `doi`.

## Preview on your computer

You need Node.js 22.23 or newer (`nvm use` picks up the version in `.nvmrc`).

```bash
npm install
npm run dev
```

Then open <http://localhost:4321>. The page reloads as you edit files in `content/`.
`npm run build` produces the final site in `dist/`. If it fails, the error usually names
the field in `bio.md` that is missing or malformed.

## Deploy

The site deploys automatically: every push to `main` runs `.github/workflows/deploy.yml`,
which builds the site and publishes it to GitHub Pages. You can follow it in the
repository's **Actions** tab.

The site lives at **<https://louisfh.com>**. **louisfreelandhaynes.com** is not served by
GitHub. It forwards to louisfh.com from the registrar.

### First-time setup

**1. GitHub repository.** Create a repository named **`louisfh.github.io`** and push this
folder to it:

```bash
git remote add origin https://github.com/louisfh/louisfh.github.io.git
git push -u origin main
```

In the repository, open **Settings → Pages**, and under **Build and deployment → Source**
choose **GitHub Actions**. The first deploy runs on the next push, or you can start it from
the **Actions** tab.

**2. Verify the domain on GitHub.** In your *account* settings (not the repository's), open
**Settings → Pages → Add a domain** and enter `louisfh.com`. GitHub gives you a `TXT` record
to add at your registrar. Once it is verified, nobody else can attach louisfh.com to their
own Pages site.

**3. DNS for louisfh.com** at your registrar. Remove any existing parking or forwarding
records for the domain, then add:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `louisfh.github.io` |

GitHub redirects `www.louisfh.com` to `louisfh.com` automatically.

**4. Custom domain in the repository.** `public/CNAME` already contains `louisfh.com`, and
the deploy publishes it, so **Settings → Pages → Custom domain** should fill itself in after
the first deploy (enter it there if it doesn't). Once the DNS check passes and the
certificate is issued (minutes to about an hour), tick **Enforce HTTPS**.

**5. Forward louisfreelandhaynes.com.** At the registrar, set up URL forwarding:

- Destination: `https://louisfh.com`
- Type: **permanent (301)**, not "masked" or "frame" forwarding
- Path forwarding on, so `louisfreelandhaynes.com/cv` lands on `louisfh.com/cv`
- Cover both `louisfreelandhaynes.com` and `www.louisfreelandhaynes.com`

Then open `https://louisfreelandhaynes.com` (with **https**) in a browser. Some registrars
only forward plain `http://` and show a certificate warning for `https://`. If that happens,
move that domain's DNS to Cloudflare's free plan and add a redirect rule there, which
handles HTTPS.

Keep both domains on auto-renew.

**Changing the domain later:** update `site` in `astro.config.mjs` and the single line in
`public/CNAME`, then update DNS.

### Day-to-day

```bash
git add content/
git commit -m "Add 2026 paper"
git push
```

## Where things are

```
content/                 your content (see above)
src/pages/               one file per page; cv.pdf.ts serves content/cv.pdf
src/components/          header, theme toggle, link list, icons, publication entry
src/layouts/Base.astro   shared <head>, header, footer
src/lib/bibtex.ts        reads publications.bib and formats citations
src/styles/global.css    colours (light and dark), fonts, spacing
astro.config.mjs         site address and base path
```

To change the accent colour, edit `--accent` in `src/styles/global.css`. It is set twice,
once for light mode and once for dark mode. Keep each value at a contrast ratio of at least
4.5:1 against `--bg`.

Astro's anonymous build telemetry is switched off in the npm scripts and the deploy workflow.
To switch it off for every Astro project on your machine, run `npx astro telemetry disable`.
