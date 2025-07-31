import { z } from 'zod';
import {
  CategoryResponseSchema,
  CategoryListResponseSchema,
  SingleCategoryResponseSchema,
  CategoryTreeResponseSchema,
} from '../../schemas/response/category.response.schema';

/**
 * 카테고리 응답 타입
 */
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

/**
 * 카테고리 목록 응답 타입 (페이지네이션 포함)
 */
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

/**
 * 단일 카테고리 응답 타입
 */
export type SingleCategoryResponse = z.infer<
  typeof SingleCategoryResponseSchema
>;

/**
 * 카테고리 트리 응답 타입 (계층 구조)
 */
export type CategoryTreeResponse = z.infer<typeof CategoryTreeResponseSchema>;
