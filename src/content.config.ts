import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 빈 값·잘못된 값이 들어와도 사이트 빌드가 멈추지 않도록 안전 처리한 필드들
const optionalDate = z.coerce.date().optional().catch(undefined);
const requiredDate = z.coerce.date().catch(() => new Date());
const orderNum = z.coerce.number().catch(0);

// 글(아카이브) — 본진 콘텐츠
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: requiredDate,
    category: z.enum(['AI 활용법', 'AI 행정혁신', 'Human Premium', '교육 노트']).catch('AI 활용법'),
    summary: z.string().optional(),
    draft: z.boolean().catch(false),
  }),
});

// 책 — 출간작·집필 중 시리즈
const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['출간', '집필 중', '기획 중']).catch('출간'),
    year: z.string().optional(),
    cover: z.string().optional(),
    link: z.string().optional(),
    order: orderNum,
  }),
});

// 영상 — 유튜브 큐레이션
const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    url: z.string(),
    thumbnail: z.string().optional(),
    date: optionalDate,
    order: orderNum,
  }),
});

// 행정지원앱 — 바이브 코딩으로 만든 실무 도구
const apps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/apps' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    url: z.string(),
    tag: z.string().optional(),
    badge: z.string().optional(),
    order: orderNum,
  }),
});

// 교육과정 — 과정별 상세 안내
const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    target: z.string().optional(),        // 교육 대상
    duration: z.string().optional(),      // 소요 시간
    format: z.string().optional(),        // 형식 (집합·방문·온라인·혼합)
    summary: z.string().optional(),       // 한 줄 소개
    objectives: z.array(z.string()).catch([]),   // 교육 목표
    curriculum: z.array(z.object({
      session: z.string().optional(),     // 회차/차시
      title: z.string().optional(),
      detail: z.string().optional(),
    })).catch([]),
    outcome: z.string().optional(),       // 기대효과
    thumbnail: z.string().optional(),
    order: orderNum,
    draft: z.boolean().catch(false),
  }),
});

export const collections = { writing, books, videos, apps, courses };
