import { z } from 'zod';
import { PostMasterSchema } from '../../schemas/master/post.schema';

/**
 * Post 엔티티 타입 (z.infer 사용)
 */
export type Post = z.infer<typeof PostMasterSchema>;