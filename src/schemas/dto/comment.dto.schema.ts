import { z } from 'zod';
import { CommentMasterSchema } from '../master/comment.schema';
import { ObjectIdSchema } from '../shared/common.schema';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 댓글 생성 DTO 스키마
 */
export const CreateCommentSchema = withExample(
  CommentMasterSchema.pick({
    content: true,
    authorId: true,
    postId: true,
  }).extend({
    parentId: ObjectIdSchema.optional(), // 대댓글인 경우
    mentionedUserIds: z.array(ObjectIdSchema).optional(),
  }),
  {
    content: '좋은 글 감사합니다! NestJS와 Zod 조합이 정말 강력하네요.',
    authorId: '507f1f77bcf86cd799439011',
    postId: '507f191e810c19729de860ea',
    parentId: '507f1f77bcf86cd799439014',
    mentionedUserIds: ['507f1f77bcf86cd799439015'],
  },
);

/**
 * 댓글 수정 DTO 스키마
 */
export const UpdateCommentSchema = withExample(
  z.object({
    content: CommentMasterSchema.shape.content,
    mentionedUserIds: z.array(ObjectIdSchema).optional(),
  }),
  {
    content: '수정된 댓글입니다. 추가 정보를 포함했습니다.',
    mentionedUserIds: ['507f1f77bcf86cd799439016'],
  },
);

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
 * 댓글 트리 구조 DTO 스키마 (재귀 스키마)
 */
type CommentTreeNodeType = z.infer<typeof CommentMasterSchema> & {
  children: CommentTreeNodeType[];
};

export const CommentTreeNodeSchema: z.ZodType<CommentTreeNodeType> = z.lazy(
  () =>
    CommentMasterSchema.extend({
      children: z.array(CommentTreeNodeSchema).default([]),
    }),
);

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
