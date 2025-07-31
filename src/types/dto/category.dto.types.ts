import { z } from 'zod';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ChangeCategoryPasswordSchema,
} from '../../schemas/dto/category.dto.schema';
import { CategoryQuerySchema } from '../../schemas/query/category.query.schema';

/**
 * 카테고리 생성 DTO 타입
 */
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

/**
 * 카테고리 수정 DTO 타입
 */
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

/**
 * 카테고리 비밀번호 변경 DTO 타입 (해당 없음)
 */
export type ChangeCategoryPasswordDto = z.infer<
  typeof ChangeCategoryPasswordSchema
>;

/**
 * 카테고리 쿼리 DTO 타입
 */
export type CategoryQueryDto = z.infer<typeof CategoryQuerySchema>;
