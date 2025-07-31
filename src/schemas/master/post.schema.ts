import { z } from 'zod';
import validator from 'validator';
import { ObjectIdSchema, TimestampsSchema } from '../shared/common.schema';
import { SlugSchema } from '../shared/validation.schema';

/**
 * Post 마스터 스키마
 * 게시물 엔티티의 Single Source of Truth
 */
export const PostMasterSchema = z
  .object({
    /**
     * 게시물 고유 식별자
     */
    id: ObjectIdSchema,

    /**
     * 게시물 제목 (1-200자)
     */
    title: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 1, max: 200 }),
        'Title must be 1-200 characters long',
      ),

    /**
     * 게시물 슬러그 (URL 친화적 식별자)
     */
    slug: SlugSchema,

    /**
     * 게시물 내용
     */
    content: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 1, max: 10000 }),
        'Content must be 1-10000 characters long',
      ),

    /**
     * 게시물 요약 (선택사항, 최대 500자)
     */
    excerpt: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 0, max: 500 }),
        'Excerpt must be maximum 500 characters',
      )
      .optional(),

    /**
     * 작성자 ID (User 참조)
     */
    authorId: ObjectIdSchema,

    /**
     * 카테고리 ID 배열 (Category 참조)
     */
    categoryIds: z.array(ObjectIdSchema).default([]),

    /**
     * 태그 배열 (선택사항)
     */
    tags: z
      .array(
        z
          .string()
          .refine(
            (val) => validator.isLength(val, { min: 1, max: 30 }),
            'Each tag must be 1-30 characters',
          ),
      )
      .max(10, 'Maximum 10 tags allowed')
      .default([]),

    /**
     * 게시물 상태
     */
    status: z.enum(['draft', 'published', 'archived']).default('draft'),

    /**
     * 공개 여부
     */
    isPublic: z.boolean().default(true),

    /**
     * 댓글 허용 여부
     */
    allowComments: z.boolean().default(true),

    /**
     * 추천 표시 여부
     */
    isFeatured: z.boolean().default(false),

    /**
     * 조회수
     */
    viewCount: z.number().int().min(0).default(0),

    /**
     * 좋아요 수
     */
    likeCount: z.number().int().min(0).default(0),

    /**
     * 댓글 수
     */
    commentCount: z.number().int().min(0).default(0),

    /**
     * 썸네일 이미지 URL (선택사항)
     */
    thumbnail: z
      .string()
      .refine(validator.isURL, 'Invalid URL format')
      .optional(),

    /**
     * SEO 메타 제목
     */
    metaTitle: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 0, max: 60 }),
        'Meta title must be maximum 60 characters',
      )
      .optional(),

    /**
     * SEO 메타 설명
     */
    metaDescription: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 0, max: 160 }),
        'Meta description must be maximum 160 characters',
      )
      .optional(),

    /**
     * 게시 예정 시간 (선택사항)
     */
    publishedAt: z.date().nullable().optional(),
  })
  .merge(TimestampsSchema);

/**
 * PostMasterSchema 타입 추론
 */
export type PostMaster = z.infer<typeof PostMasterSchema>;
