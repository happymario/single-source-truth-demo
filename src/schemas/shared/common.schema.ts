import { z } from 'zod';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * MongoDB ObjectId 패턴 검증
 */
export const ObjectIdSchema = withExample(
  z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid MongoDB ObjectId format',
  }),
  '507f1f77bcf86cd799439011',
);

/**
 * 타임스탬프 스키마
 */
export const TimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * 페이지네이션 스키마
 */
export const PaginationSchema = withExample(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
  {
    page: 1,
    limit: 10,
  },
);

/**
 * 정렬 스키마
 */
export const SortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * 페이지네이션과 정렬을 포함한 쿼리 스키마
 */
export const BaseQuerySchema = PaginationSchema.merge(SortingSchema);

/**
 * 페이지네이션 응답 메타데이터
 */
export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

/**
 * 페이지네이션 응답 래퍼 생성 함수
 */
export function createPaginatedResponseSchema<T extends z.ZodSchema>(
  itemSchema: T,
) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

/**
 * API 응답 래퍼 생성 함수
 */
export function createResponseSchema<T extends z.ZodSchema>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.date(),
  });
}

/**
 * 에러 응답 스키마
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    statusCode: z.number(),
    timestamp: z.date(),
    path: z.string().optional(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});
