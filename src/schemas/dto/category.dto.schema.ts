import { CategoryMasterSchema } from '../master/category.schema';

/**
 * 카테고리 생성 DTO 스키마
 * 마스터 스키마에서 시스템 생성 필드 제외
 */
export const CreateCategorySchema = CategoryMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * 카테고리 수정 DTO 스키마
 * 생성 DTO의 모든 필드를 선택사항으로 변경
 */
export const UpdateCategorySchema = CreateCategorySchema.partial();

/**
 * 카테고리 비밀번호 변경 DTO 스키마 (해당 없음, 일관성을 위해 유지)
 * 카테고리는 비밀번호가 없으므로 빈 스키마
 */
export const ChangeCategoryPasswordSchema = CategoryMasterSchema.pick(
  {},
).optional();
