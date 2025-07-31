import { z } from 'zod';
import {
  PostResponseSchema,
  PostListResponseSchema,
  PostWithAuthorResponseSchema,
  PostWithCategoriesResponseSchema,
  PostWithRelationsResponseSchema,
  CreatePostResponseSchema,
  UpdatePostResponseSchema,
  DeletePostResponseSchema,
  PostStatsResponseSchema,
  PopularPostsResponseSchema,
  RelatedPostsResponseSchema,
} from '../../schemas/response/post.response.schema';

/**
 * Post API 응답 타입들 (z.infer 사용)
 */
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;
export type PostWithAuthorResponse = z.infer<typeof PostWithAuthorResponseSchema>;
export type PostWithCategoriesResponse = z.infer<typeof PostWithCategoriesResponseSchema>;
export type PostWithRelationsResponse = z.infer<typeof PostWithRelationsResponseSchema>;
export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>;
export type UpdatePostResponse = z.infer<typeof UpdatePostResponseSchema>;
export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>;
export type PostStatsResponse = z.infer<typeof PostStatsResponseSchema>;
export type PopularPostsResponse = z.infer<typeof PopularPostsResponseSchema>;
export type RelatedPostsResponse = z.infer<typeof RelatedPostsResponseSchema>;