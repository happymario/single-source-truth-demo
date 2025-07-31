import { z } from 'zod';
import { CommentMasterSchema } from '../../schemas/master/comment.schema';

/**
 * Comment 엔티티 타입 (z.infer 사용)
 */
export type Comment = z.infer<typeof CommentMasterSchema>;
