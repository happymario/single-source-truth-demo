import { z } from 'zod';
import { PostMasterSchema } from '../master/post.schema';
import { UserMasterSchema } from '../master/user.schema';
import { CategoryMasterSchema } from '../master/category.schema';

/**
 * 게시물 기본 응답 스키마 (민감한 정보 제거)
 */
export const PostResponseSchema = PostMasterSchema.omit({
  // 민감한 정보는 없지만 일관성을 위해 기본 스키마와 동일하게 유지
});

/**
 * 게시물 목록 응답 스키마
 */
export const PostListResponseSchema = z.object({
  posts: z.array(PostResponseSchema),
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
 * 작성자 정보 포함 게시물 응답 스키마
 */
export const PostWithAuthorResponseSchema = PostResponseSchema.extend({
  author: UserMasterSchema.omit({
    password: true,
    lastLoginAt: true,
  }),
});

/**
 * 카테고리 정보 포함 게시물 응답 스키마
 */
export const PostWithCategoriesResponseSchema = PostResponseSchema.extend({
  categories: z.array(CategoryMasterSchema),
});

/**
 * 모든 관련 정보 포함 게시물 응답 스키마
 */
export const PostWithRelationsResponseSchema = PostResponseSchema.extend({
  author: UserMasterSchema.omit({
    password: true,
    lastLoginAt: true,
  }),
  categories: z.array(CategoryMasterSchema),
});

/**
 * 게시물 생성 응답 스키마
 */
export const CreatePostResponseSchema = z.object({
  message: z.string(),
  post: PostResponseSchema,
});

/**
 * 게시물 수정 응답 스키마
 */
export const UpdatePostResponseSchema = z.object({
  message: z.string(),
  post: PostResponseSchema,
});

/**
 * 게시물 삭제 응답 스키마
 */
export const DeletePostResponseSchema = z.object({
  message: z.string(),
  deletedId: z.string(),
});

/**
 * 게시물 통계 응답 스키마
 */
export const PostStatsResponseSchema = z.object({
  totalPosts: z.number().int().min(0),
  publishedPosts: z.number().int().min(0),
  draftPosts: z.number().int().min(0),
  archivedPosts: z.number().int().min(0),
  totalViews: z.number().int().min(0),
  totalLikes: z.number().int().min(0),
  totalComments: z.number().int().min(0),
  averageViewsPerPost: z.number().min(0),
  averageLikesPerPost: z.number().min(0),
  averageCommentsPerPost: z.number().min(0),
  dailyStats: z
    .array(
      z.object({
        date: z.string(), // YYYY-MM-DD 형식
        posts: z.number().int().min(0),
        views: z.number().int().min(0),
        likes: z.number().int().min(0),
        comments: z.number().int().min(0),
      }),
    )
    .optional(),
});

/**
 * 인기 게시물 응답 스키마
 */
export const PopularPostsResponseSchema = z.object({
  mostViewed: z.array(PostResponseSchema),
  mostLiked: z.array(PostResponseSchema),
  mostCommented: z.array(PostResponseSchema),
  trending: z.array(PostResponseSchema),
});

/**
 * 관련 게시물 응답 스키마
 */
export const RelatedPostsResponseSchema = z.object({
  relatedPosts: z.array(PostResponseSchema),
  sameAuthorPosts: z.array(PostResponseSchema),
  sameCategoryPosts: z.array(PostResponseSchema),
});
