import { z } from 'zod';
import { ObjectIdSchema } from '../shared/common.schema';
import { SlugSchema } from '../shared/validation.schema';

/**
 * 게시물 목록 조회 쿼리 스키마
 */
export const PostListQuerySchema = z.object({
  /**
   * 페이지 번호 (1부터 시작)
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * 페이지당 항목 수
   */
  limit: z.coerce.number().int().min(1).max(100).default(10),

  /**
   * 정렬 기준
   */
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'publishedAt',
      'viewCount',
      'likeCount',
      'title',
    ])
    .default('createdAt'),

  /**
   * 정렬 순서
   */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  /**
   * 검색어 (제목, 내용, 태그에서 검색)
   */
  search: z.string().optional(),

  /**
   * 작성자 ID 필터
   */
  authorId: ObjectIdSchema.optional(),

  /**
   * 카테고리 ID 필터
   */
  categoryId: ObjectIdSchema.optional(),

  /**
   * 태그 필터
   */
  tag: z.string().optional(),

  /**
   * 상태 필터
   */
  status: z.enum(['draft', 'published', 'archived']).optional(),

  /**
   * 공개 여부 필터
   */
  isPublic: z.coerce.boolean().optional(),

  /**
   * 추천 게시물 필터
   */
  isFeatured: z.coerce.boolean().optional(),

  /**
   * 날짜 범위 필터 - 시작일
   */
  startDate: z.coerce.date().optional(),

  /**
   * 날짜 범위 필터 - 종료일
   */
  endDate: z.coerce.date().optional(),
});

/**
 * 게시물 단일 조회 쿼리 스키마 (ID 또는 슬러그)
 */
export const PostFindQuerySchema = z.object({
  /**
   * 관련 데이터 포함 여부
   */
  include: z.array(z.enum(['author', 'categories', 'comments'])).optional(),

  /**
   * 조회수 증가 여부
   */
  incrementView: z.coerce.boolean().default(false),
});

/**
 * 게시물 ID 파라미터 스키마
 */
export const PostIdParamSchema = z.object({
  id: ObjectIdSchema,
});

/**
 * 게시물 슬러그 파라미터 스키마
 */
export const PostSlugParamSchema = z.object({
  slug: SlugSchema,
});

/**
 * 작성자별 게시물 조회 쿼리 스키마
 */
export const PostsByAuthorQuerySchema = PostListQuerySchema.extend({
  authorId: ObjectIdSchema,
});

/**
 * 카테고리별 게시물 조회 쿼리 스키마
 */
export const PostsByCategoryQuerySchema = PostListQuerySchema.extend({
  categoryId: ObjectIdSchema,
});

/**
 * 태그별 게시물 조회 쿼리 스키마
 */
export const PostsByTagQuerySchema = PostListQuerySchema.extend({
  tag: z.string(),
});

/**
 * 게시물 통계 조회 쿼리 스키마
 */
export const PostStatsQuerySchema = z.object({
  /**
   * 기간 (일, 주, 월, 년)
   */
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),

  /**
   * 시작 날짜
   */
  startDate: z.coerce.date().optional(),

  /**
   * 종료 날짜
   */
  endDate: z.coerce.date().optional(),
});
