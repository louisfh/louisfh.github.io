import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// content/bio.md: the frontmatter holds the structured profile, the body is the bio.
const bio = defineCollection({
  loader: glob({ pattern: 'bio.md', base: './content' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      position: z.string().optional(),
      affiliation: z.string().optional(),
      description: z.string().optional(),
      email: z.string().optional(),
      photo: image(),
      photoAlt: z.string(),
      office: z.string().optional(),
      publicationNames: z.array(z.string()).default([]),
      interests: z.array(z.string()).default([]),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    }),
});

export const collections = { bio };
