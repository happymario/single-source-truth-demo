import { z } from 'zod';
import { CommentMasterSchema } from '../master/comment.schema';
import { UserMasterSchema } from '../master/user.schema';
import { PostMasterSchema } from '../master/post.schema';

/**
 * 댓글 기본 응답 스키마
 */
export const CommentResponseSchema = CommentMasterSchema.omit({
  metadata: true, // 메타데이터는 민감 정보이므로 제외
});

/**
 * 댓글 목록 응답 스키마
 */
export const CommentListResponseSchema = z.object({
  comments: z.array(CommentResponseSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

/**
 * 작성자 정보 포함 댓글 응답 스키마
 */
export const CommentWithAuthorResponseSchema = CommentResponseSchema.extend({
  author: UserMasterSchema.pick({
    id: true,
    name: true,
    avatar: true,
    role: true,
  }),
});

/**
 * 답글 포함 댓글 응답 스키마
 */
export const CommentWithRepliesResponseSchema = CommentResponseSchema.extend({
  replies: z.array(CommentResponseSchema),
  replyCount: z.number().int().min(0),
});

/**
 * 댓글 트리 구조 응답 스키마
 */
export const CommentTreeResponseSchema: z.ZodType<CommentTreeResponse> = z.lazy(
  () =>
    CommentResponseSchema.extend({
      author: UserMasterSchema.pick({
        id: true,
        name: true,
        avatar: true,
        role: true,
      }).optional(),
      children: z.array(CommentTreeResponseSchema).default([]),
    }),
);

export interface CommentTreeResponse
  extends z.infer<typeof CommentResponseSchema> {
  author?: {
    id: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin';
  };
  children: CommentTreeResponse[];
}

/**
 * 댓글 스레드 응답 스키마
 */
export const CommentThreadResponseSchema = z.object({
  thread: CommentTreeResponseSchema,
  totalComments: z.number().int().min(0),
  maxDepth: z.number().int().min(0),
});

/**
 * 댓글 생성 응답 스키마
 */
export const CreateCommentResponseSchema = z.object({
  message: z.string(),
  comment: CommentWithAuthorResponseSchema,
});

/**
 * 댓글 수정 응답 스키마
 */
export const UpdateCommentResponseSchema = z.object({
  message: z.string(),
  comment: CommentResponseSchema,
});

/**
 * 댓글 삭제 응답 스키마
 */
export const DeleteCommentResponseSchema = z.object({
  message: z.string(),
  deletedId: z.string(),
  affectedReplies: z.number().int().min(0),
});

/**
 * 댓글 액션 응답 스키마
 */
export const CommentActionResponseSchema = z.object({
  message: z.string(),
  commentId: z.string(),
  action: z.enum(['like', 'unlike', 'report']),
  newLikeCount: z.number().int().min(0).optional(),
});

/**
 * 댓글 통계 응답 스키마
 */
export const CommentStatsResponseSchema = z.object({
  totalComments: z.number().int().min(0),
  activeComments: z.number().int().min(0),
  deletedComments: z.number().int().min(0),
  totalLikes: z.number().int().min(0),
  totalReports: z.number().int().min(0),
  averageDepth: z.number().min(0),
  topCommenters: z
    .array(
      z.object({
        userId: z.string(),
        userName: z.string(),
        commentCount: z.number().int().min(0),
      }),
    )
    .optional(),
  dailyStats: z
    .array(
      z.object({
        date: z.string(), // YYYY-MM-DD 형식
        comments: z.number().int().min(0),
        likes: z.number().int().min(0),
        reports: z.number().int().min(0),
      }),
    )
    .optional(),
});

/**
 * 댓글 멘션 응답 스키마
 */
export const CommentMentionResponseSchema = z.object({
  id: z.string(),
  comment: CommentWithAuthorResponseSchema,
  post: PostMasterSchema.pick({
    id: true,
    title: true,
    slug: true,
  }),
  mentionedAt: z.date(),
  isRead: z.boolean(),
});

/**
 * 댓글 멘션 목록 응답 스키마
 */
export const CommentMentionListResponseSchema = z.object({
  mentions: z.array(CommentMentionResponseSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});
