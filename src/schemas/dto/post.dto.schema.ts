import { z } from 'zod';
import { PostMasterSchema } from '../master/post.schema';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 게시물 생성 DTO 스키마
 * id, createdAt, updatedAt, publishedAt, 통계 필드 제외
 */
export const CreatePostSchema = withExample(
  PostMasterSchema.omit({
    id: true,
    viewCount: true,
    likeCount: true,
    commentCount: true,
    createdAt: true,
    updatedAt: true,
    publishedAt: true,
  }),
  {
    title: 'NestJS와 Zod를 활용한 타입 안전한 백엔드 개발',
    slug: 'nestjs-zod-type-safe-backend',
    content:
      '이 글에서는 NestJS와 Zod를 활용하여 타입 안전한 백엔드 API를 개발하는 방법을 소개합니다.',
    authorId: '507f1f77bcf86cd799439011',
    categoryIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    tags: ['nestjs', 'zod', 'typescript', 'backend'],
    excerpt:
      'NestJS와 Zod의 강력한 조합으로 런타임 타입 검증과 컴파일 타임 타입 안전성을 동시에 확보하세요.',
    thumbnail: 'https://example.com/cover-image.jpg',
    status: 'draft',
    isPublic: true,
    allowComments: true,
    isFeatured: false,
  },
);

/**
 * 게시물 수정 DTO 스키마
 * id, authorId, 통계 필드, 타임스탬프 제외하고 모든 필드 선택사항
 */
export const UpdatePostSchema = withExample(
  PostMasterSchema.omit({
    id: true,
    authorId: true,
    viewCount: true,
    likeCount: true,
    commentCount: true,
    createdAt: true,
    updatedAt: true,
  }).partial(),
  {
    title: 'NestJS와 Zod를 활용한 타입 안전한 백엔드 개발 (업데이트)',
    content: '업데이트된 내용: 실전 예제 코드와 함께 더욱 자세하게 설명합니다.',
    tags: ['nestjs', 'zod', 'typescript', 'backend', 'update'],
    excerpt: '업데이트: 실전 예제 코드 추가',
    status: 'published',
  },
);

/**
 * 게시물 발행 DTO 스키마
 */
export const PublishPostSchema = z.object({
  status: z.literal('published'),
  publishedAt: z.date().optional(),
});

/**
 * 게시물 아카이브 DTO 스키마
 */
export const ArchivePostSchema = z.object({
  status: z.literal('archived'),
});

/**
 * 게시물 통계 업데이트 DTO 스키마 (내부 사용)
 */
export const UpdatePostStatsSchema = z.object({
  viewCount: z.number().int().min(0).optional(),
  likeCount: z.number().int().min(0).optional(),
  commentCount: z.number().int().min(0).optional(),
});

/**
 * 게시물 상태 변경 DTO 스키마
 */
export const ChangePostStatusSchema = z.object({
  status: PostMasterSchema.shape.status,
  publishedAt: z.date().nullable().optional(),
});
