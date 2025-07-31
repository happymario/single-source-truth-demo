import { z } from 'zod';
import { CommentMasterSchema } from '../master/comment.schema';
import { ObjectIdSchema } from '../shared/common.schema';

/**
 * 댓글 생성 DTO 스키마
 */
export const CreateCommentSchema = CommentMasterSchema.pick({
  content: true,
  authorId: true,
  postId: true,
}).extend({
  parentId: ObjectIdSchema.optional(), // 대댓글인 경우
  mentionedUserIds: z.array(ObjectIdSchema).optional(),
});

/**
 * 댓글 수정 DTO 스키마
 */
export const UpdateCommentSchema = z.object({
  content: CommentMasterSchema.shape.content,
  mentionedUserIds: z.array(ObjectIdSchema).optional(),
});

/**
 * 댓글 삭제 DTO 스키마 (soft delete)
 */
export const DeleteCommentSchema = z.object({
  deleteReason: z.string().optional(),
});

/**
 * 댓글 좋아요/신고 DTO 스키마
 */
export const CommentActionSchema = z.object({
  action: z.enum(['like', 'unlike', 'report']),
  reason: z.string().optional(), // 신고 사유
});

/**
 * 댓글 트리 구조 DTO 스키마
 */
export const CommentTreeNodeSchema: z.ZodType<CommentTreeNode> = z.lazy(() =>
  CommentMasterSchema.extend({
    children: z.array(CommentTreeNodeSchema).default([]),
  }),
);

export interface CommentTreeNode extends z.infer<typeof CommentMasterSchema> {
  children: CommentTreeNode[];
}

/**
 * 댓글 대량 작업 DTO 스키마
 */
export const BulkCommentActionSchema = z.object({
  commentIds: z.array(ObjectIdSchema).min(1),
  action: z.enum(['delete', 'restore', 'approve', 'reject']),
});

/**
 * 댓글 필터 DTO 스키마
 */
export const CommentFilterSchema = z.object({
  authorId: ObjectIdSchema.optional(),
  postId: ObjectIdSchema.optional(),
  status: CommentMasterSchema.shape.status.optional(),
  isDeleted: z.boolean().optional(),
  hasReplies: z.boolean().optional(),
  minLikeCount: z.number().int().min(0).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

/**
 * 댓글 쿼리 DTO 스키마 (페이징 포함)
 */
export const CommentQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeDeleted: z.boolean().default(false),
  includeAuthor: z.boolean().default(false),
  parentId: z.string().nullable().optional(),
});

/**
 * 댓글 트리/스레드 쿼리 DTO 스키마
 */
export const CommentTreeQuerySchema = z.object({
  includeDeleted: z.boolean().default(false),
  includeAuthor: z.boolean().default(false),
});
