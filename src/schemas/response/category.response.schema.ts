import { CategoryMasterSchema } from '../master/category.schema';
import {
  createPaginatedResponseSchema,
  createResponseSchema,
} from '../shared/common.schema';

/**
 * 카테고리 응답 스키마 (전체 필드 포함)
 * 카테고리는 민감한 정보가 없으므로 마스터 스키마와 동일
 */
export const CategoryResponseSchema = CategoryMasterSchema;

/**
 * 카테고리 목록 응답 스키마 (페이지네이션 포함)
 */
export const CategoryListResponseSchema = createPaginatedResponseSchema(
  CategoryResponseSchema,
);

/**
 * 단일 카테고리 응답 스키마
 */
export const SingleCategoryResponseSchema = createResponseSchema(
  CategoryResponseSchema,
);

/**
 * 카테고리 트리 응답 스키마 (계층 구조)
 */
export const CategoryTreeResponseSchema = CategoryResponseSchema.extend({
  /**
   * 자식 카테고리들 (재귀적 구조)
   */
  children: CategoryResponseSchema.array().optional(),
});
