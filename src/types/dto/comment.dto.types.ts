import { z } from 'zod';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  DeleteCommentSchema,
  CommentActionSchema,
  CommentTreeNodeSchema,
  BulkCommentActionSchema,
  CommentFilterSchema,
} from '../../schemas/dto/comment.dto.schema';

/**
 * Comment DTO 타입들 (z.infer 사용)
 */
export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
export type DeleteCommentDto = z.infer<typeof DeleteCommentSchema>;
export type CommentActionDto = z.infer<typeof CommentActionSchema>;
export type CommentTreeNode = z.infer<typeof CommentTreeNodeSchema>;
export type BulkCommentActionDto = z.infer<typeof BulkCommentActionSchema>;
export type CommentFilterDto = z.infer<typeof CommentFilterSchema>;