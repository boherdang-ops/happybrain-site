import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 글(아카이브) — 본진 콘텐츠
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['AI 활용법', 'AI 행정혁신', 'Human Premium', '교육 노트']),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// 책 — 출간작·집필 중 시리즈
const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['출간', '집필 중', '기획 중']).default('출간'),
    year: z.string().optional(),
    cover: z.string().optional(),
    link: z.string().optional(),
    order: z.number().default(0),
  }),
});

// 영상 — 유튜브 큐레이션
const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    url: z.string(),
    thumbnail: z.string().optional(),
    date: z.coerce.date().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { writing, books, videos };
