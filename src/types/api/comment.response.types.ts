import { z } from 'zod';
import {
  CommentResponseSchema,
  CommentListResponseSchema,
  CommentWithAuthorResponseSchema,
  CommentWithRepliesResponseSchema,
  CommentTreeResponseSchema,
  CommentThreadResponseSchema,
  CreateCommentResponseSchema,
  UpdateCommentResponseSchema,
  DeleteCommentResponseSchema,
  CommentActionResponseSchema,
  CommentStatsResponseSchema,
  CommentMentionResponseSchema,
  CommentMentionListResponseSchema,
} from '../../schemas/response/comment.response.schema';

/**
 * Comment API 응답 타입들 (z.infer 사용)
 */
export type CommentResponse = z.infer<typeof CommentResponseSchema>;
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>;
export type CommentWithAuthorResponse = z.infer<typeof CommentWithAuthorResponseSchema>;
export type CommentWithRepliesResponse = z.infer<typeof CommentWithRepliesResponseSchema>;
export type CommentTreeResponse = z.infer<typeof CommentTreeResponseSchema>;
export type CommentThreadResponse = z.infer<typeof CommentThreadResponseSchema>;
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;
export type UpdateCommentResponse = z.infer<typeof UpdateCommentResponseSchema>;
export type DeleteCommentResponse = z.infer<typeof DeleteCommentResponseSchema>;
export type CommentActionResponse = z.infer<typeof CommentActionResponseSchema>;
export type CommentStatsResponse = z.infer<typeof CommentStatsResponseSchema>;
export type CommentMentionResponse = z.infer<typeof CommentMentionResponseSchema>;
export type CommentMentionListResponse = z.infer<typeof CommentMentionListResponseSchema>;