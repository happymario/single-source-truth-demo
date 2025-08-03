import { z } from 'zod';
import {
  PostListQuerySchema,
  PostFindQuerySchema,
  PostIdParamSchema,
  PostSlugParamSchema,
  PostStatsQuerySchema,
} from '../../schemas/query/post.query.schema';

/**
 * Post Query 타입들 (z.infer 사용)
 */
export type PostListQueryDto = z.infer<typeof PostListQuerySchema>;
export type PostFindQueryDto = z.infer<typeof PostFindQuerySchema>;
export type PostIdParamDto = z.infer<typeof PostIdParamSchema>;
export type PostSlugParamDto = z.infer<typeof PostSlugParamSchema>;
export type PostStatsQueryDto = z.infer<typeof PostStatsQuerySchema>;
