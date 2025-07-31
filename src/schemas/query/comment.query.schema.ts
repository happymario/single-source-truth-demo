import { z } from 'zod';
import { ObjectIdSchema } from '../shared/common.schema';

/**
 * 댓글 목록 조회 쿼리 스키마
 */
export const CommentListQuerySchema = z.object({
  /**
   * 페이지 번호 (1부터 시작)
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * 페이지당 항목 수
   */
  limit: z.coerce.number().int().min(1).max(100).default(20),

  /**
   * 정렬 기준
   */
  sortBy: z.enum(['createdAt', 'likeCount', 'depth']).default('createdAt'),

  /**
   * 정렬 순서
   */
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  /**
   * 게시물 ID (필수)
   */
  postId: ObjectIdSchema,

  /**
   * 부모 댓글 ID (특정 댓글의 답글만 조회)
   */
  parentId: ObjectIdSchema.optional(),

  /**
   * 작성자 ID 필터
   */
  authorId: ObjectIdSchema.optional(),

  /**
   * 댓글 상태 필터
   */
  status: z.enum(['active', 'edited', 'deleted']).optional(),

  /**
   * 삭제된 댓글 포함 여부
   */
  includeDeleted: z.coerce.boolean().default(false),

  /**
   * 트리 구조로 반환할지 여부
   */
  asTree: z.coerce.boolean().default(false),

  /**
   * 최대 깊이 (트리 구조일 때)
   */
  maxDepth: z.coerce.number().int().min(0).max(5).optional(),
});

/**
 * 댓글 단일 조회 쿼리 스키마
 */
export const CommentFindQuerySchema = z.object({
  /**
   * 관련 데이터 포함 여부
   */
  include: z.array(z.enum(['author', 'replies', 'post'])).optional(),

  /**
   * 답글 깊이 (답글을 몇 단계까지 가져올지)
   */
  replyDepth: z.coerce.number().int().min(0).max(5).default(0),
});

/**
 * 댓글 ID 파라미터 스키마
 */
export const CommentIdParamSchema = z.object({
  id: ObjectIdSchema,
});

/**
 * 댓글 스레드 조회 쿼리 스키마
 */
export const CommentThreadQuerySchema = z.object({
  /**
   * 루트 댓글 ID
   */
  rootId: ObjectIdSchema,

  /**
   * 최대 깊이
   */
  maxDepth: z.coerce.number().int().min(1).max(5).default(5),

  /**
   * 삭제된 댓글 포함 여부
   */
  includeDeleted: z.coerce.boolean().default(false),
});

/**
 * 사용자별 댓글 조회 쿼리 스키마
 */
export const CommentsByAuthorQuerySchema = z.object({
  /**
   * 작성자 ID
   */
  authorId: ObjectIdSchema,

  /**
   * 페이지 번호
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * 페이지당 항목 수
   */
  limit: z.coerce.number().int().min(1).max(100).default(20),

  /**
   * 정렬 기준
   */
  sortBy: z.enum(['createdAt', 'likeCount']).default('createdAt'),

  /**
   * 정렬 순서
   */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  /**
   * 댓글 상태 필터
   */
  status: z.enum(['active', 'edited', 'deleted']).optional(),
});

/**
 * 댓글 통계 조회 쿼리 스키마
 */
export const CommentStatsQuerySchema = z.object({
  /**
   * 게시물 ID (선택)
   */
  postId: ObjectIdSchema.optional(),

  /**
   * 작성자 ID (선택)
   */
  authorId: ObjectIdSchema.optional(),

  /**
   * 기간
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

/**
 * 댓글 멘션 조회 쿼리 스키마
 */
export const CommentMentionsQuerySchema = z.object({
  /**
   * 멘션된 사용자 ID
   */
  userId: ObjectIdSchema,

  /**
   * 읽음 여부 필터
   */
  isRead: z.coerce.boolean().optional(),

  /**
   * 페이지 번호
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * 페이지당 항목 수
   */
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
