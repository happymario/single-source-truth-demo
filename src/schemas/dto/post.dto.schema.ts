import { z } from 'zod';
import { PostMasterSchema } from '../master/post.schema';

/**
 * 게시물 생성 DTO 스키마
 * id, createdAt, updatedAt, publishedAt, 통계 필드 제외
 */
export const CreatePostSchema = PostMasterSchema.omit({
  id: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

/**
 * 게시물 수정 DTO 스키마
 * id, authorId, 통계 필드, 타임스탬프 제외하고 모든 필드 선택사항
 */
export const UpdatePostSchema = PostMasterSchema.omit({
  id: true,
  authorId: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/**
 * 게시물 발행 DTO 스키마
 */
export const PublishPostSchema = z.object({
  status: z.literal('published'),
  publishedAt: z.date().optional(),
});

/**
 * 게시물 아카이브 DTO 스키마
 */
export const ArchivePostSchema = z.object({
  status: z.literal('archived'),
});

/**
 * 게시물 통계 업데이트 DTO 스키마 (내부 사용)
 */
export const UpdatePostStatsSchema = z.object({
  viewCount: z.number().int().min(0).optional(),
  likeCount: z.number().int().min(0).optional(),
  commentCount: z.number().int().min(0).optional(),
});

/**
 * 게시물 상태 변경 DTO 스키마
 */
export const ChangePostStatusSchema = z.object({
  status: PostMasterSchema.shape.status,
  publishedAt: z.date().nullable().optional(),
});