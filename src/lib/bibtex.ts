// Reads content/publications.bib at build time and turns each entry into a
// display-ready citation. Nothing here runs in the browser.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, type Creator, type Entry } from '@retorquere/bibtex-parser/js';

export interface PubLink {
  label: string;
  href: string;
}

export interface Publication {
  key: string;
  year: string;
  /** Safe HTML: escaped text plus a few formatting tags (<i>, <b>, <sup>, <sub>). */
  title: string;
  authors: { name: string; isMe: boolean }[];
  venue: string;
  links: PubLink[];
}

const BIB_PATH = resolve('content/publications.bib');

const ALLOWED_TAGS = new Set(['i', 'em', 'b', 'strong', 'sup', 'sub']);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escape the parser's output, keeping only simple formatting tags. */
function toSafeHtml(s: string | undefined): string {
  if (!s) return '';
  let out = '';
  let last = 0;
  for (const m of s.matchAll(/<(\/?)([a-z]+)(?:\s[^>]*)?>/gi)) {
    out += escapeHtml(s.slice(last, m.index));
    const tag = m[2].toLowerCase();
    if (ALLOWED_TAGS.has(tag)) out += `<${m[1]}${tag}>`;
    last = m.index! + m[0].length;
  }
  return out + escapeHtml(s.slice(last));
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '');

/** Fold case and accents so "Müller" in the .bib matches "Muller" in bio.md. */
const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** "Anna Maria" → "A. M.", "Jean-Paul" → "J.-P." */
const initials = (first: string) =>
  first
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.split('-').map((p) => `${p[0]}.`).join('-'))
    .join(' ');

function formatCreator(c: Creator): string {
  if (c.name) return stripTags(c.name);
  const last = [c.prefix, c.lastName].filter(Boolean).join(' ');
  const name = c.firstName ? `${initials(stripTags(c.firstName))} ${last}` : last;
  return stripTags(c.suffix ? `${name}, ${c.suffix}` : name);
}

function formatVenue(e: Entry): string {
  const f = e.fields;
  const pages = f.pages ? toSafeHtml(f.pages) : '';
  switch (e.type) {
    case 'article': {
      if (!f.journal) return '';
      let v = `<i>${toSafeHtml(f.journal)}</i>`;
      if (f.volume) v += ` ${toSafeHtml(f.volume)}`;
      if (f.number) v += `(${toSafeHtml(f.number)})`;
      if (pages) v += f.volume ? `: ${pages}` : `, ${pages}`;
      return v;
    }
    case 'inproceedings':
    case 'incollection':
    case 'conference': {
      if (!f.booktitle) return '';
      return `In <i>${toSafeHtml(f.booktitle)}</i>${pages ? `, ${pages}` : ''}`;
    }
    case 'phdthesis':
      return ['PhD thesis', toSafeHtml(f.school ?? f.institution?.join(', '))].filter(Boolean).join(', ');
    case 'mastersthesis':
      return ["Master's thesis", toSafeHtml(f.school ?? f.institution?.join(', '))].filter(Boolean).join(', ');
    case 'book':
      return toSafeHtml(f.publisher?.join(', '));
    case 'techreport':
      return ['Technical report', toSafeHtml(f.institution?.join(', '))].filter(Boolean).join(', ');
    default:
      return toSafeHtml(f.journal ?? f.howpublished ?? f.booktitle ?? f.publisher?.join(', ') ?? f.note);
  }
}

/** Only http(s) links are kept, so a typo in the .bib can't produce a javascript: URL. */
const isWebUrl = (s: string | undefined): s is string => !!s && /^https?:\/\//i.test(s.trim());

function formatLinks(e: Entry): PubLink[] {
  const f = e.fields;
  const links: PubLink[] = [];
  if (f.doi) {
    const doi = stripTags(f.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    links.push({ label: 'DOI', href: `https://doi.org/${doi}` });
  }
  const extra: [string, string | undefined][] = [
    ['PDF', f.pdf],
    ['Preprint', f.preprint],
    ['Code', f.code],
    ['Data', f.data],
  ];
  // `url` is shown only when it adds something beyond the DOI.
  if (!f.doi) extra.unshift(['Link', f.url]);
  for (const [label, raw] of extra) {
    const href = raw && stripTags(raw).trim();
    if (isWebUrl(href)) links.push({ label, href });
  }
  return links;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthIndex(m: string | undefined): number {
  if (!m) return 0;
  const n = Number.parseInt(m, 10);
  if (!Number.isNaN(n)) return n;
  return MONTHS.indexOf(m.slice(0, 3).toLowerCase()) + 1;
}

function entryYear(e: Entry): string {
  const y = stripTags(e.fields.year ?? e.fields.date ?? '').trim();
  const fourDigits = y.match(/\d{4}/);
  return fourDigits && /^\d{4}/.test(y) ? fourDigits[0] : y || 'Undated';
}

/** Non-numeric years ("In press", "Submitted") sort above all numbered years. */
const yearRank = (y: string) => (/^\d{4}$/.test(y) ? Number(y) : Number.POSITIVE_INFINITY);

export function loadPublications(myNames: string[]): Publication[] {
  // Titles are shown exactly as written in the .bib. The parser sentence-cases
  // title fields whatever `sentenceCase` says, so they are read as rich text instead.
  const asWritten = ['title', 'booktitle', 'journal', 'journaltitle', 'series', 'maintitle'];
  const library = parse(readFileSync(BIB_PATH, 'utf8'), {
    sentenceCase: false,
    fieldMode: Object.fromEntries(asWritten.map((f) => [f, 'richtext'])),
    unsupported: 'ignore',
  });
  for (const err of library.errors) console.warn(`[publications.bib] ${err.error}`);

  const mine = new Set(myNames.map(normalize));
  const pubs = library.entries.map((e) => ({
    pub: {
      key: e.key,
      year: entryYear(e),
      title: toSafeHtml(e.fields.title) || '(Untitled)',
      authors: (e.fields.author ?? []).map((c) => ({
        name: formatCreator(c),
        isMe: mine.has(normalize(stripTags(c.lastName ?? c.name ?? ''))),
      })),
      venue: formatVenue(e),
      links: formatLinks(e),
    } satisfies Publication,
    month: monthIndex(e.fields.month),
  }));

  pubs.sort(
    (a, b) =>
      yearRank(b.pub.year) - yearRank(a.pub.year) ||
      b.month - a.month ||
      stripTags(a.pub.title).localeCompare(stripTags(b.pub.title)),
  );
  return pubs.map((p) => p.pub);
}

/** Group already-sorted publications by year, keeping order. */
export function groupByYear(pubs: Publication[]): [string, Publication[]][] {
  const groups = new Map<string, Publication[]>();
  for (const p of pubs) {
    if (!groups.has(p.year)) groups.set(p.year, []);
    groups.get(p.year)!.push(p);
  }
  return [...groups];
}
