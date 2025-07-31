import { z } from 'zod';
import { PaginationSchema, SortingSchema } from '../shared/common.schema';
import { ObjectIdSchema } from '../shared/common.schema';

/**
 * 카테고리 목록 조회 쿼리 스키마
 */
export const CategoryQuerySchema = PaginationSchema.extend({
  /**
   * 카테고리 이름으로 검색 (부분 일치)
   */
  name: z.string().optional(),

  /**
   * 슬러그로 검색 (정확히 일치)
   */
  slug: z.string().optional(),

  /**
   * 부모 카테고리 ID로 필터링
   */
  parentId: ObjectIdSchema.optional(),

  /**
   * 활성 상태로 필터링
   */
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  /**
   * 정렬 기준 (name, order, createdAt)
   */
  sortBy: z.enum(['name', 'order', 'createdAt', 'updatedAt']).default('order'),

  /**
   * 정렬 순서
   */
  sortOrder: SortingSchema.shape.sortOrder,
});
