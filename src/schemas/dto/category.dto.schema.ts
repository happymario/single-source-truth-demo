import { CategoryMasterSchema } from '../master/category.schema';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 카테고리 생성 DTO 스키마
 * 마스터 스키마에서 시스템 생성 필드 제외
 */
export const CreateCategorySchema = withExample(
  CategoryMasterSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  {
    name: '프로그래밍',
    slug: 'programming',
    description: '프로그래밍 관련 기술 블로그 포스트',
    color: '#3B82F6',
    order: 1,
    isActive: true,
    parentId: null,
  },
);

/**
 * 카테고리 수정 DTO 스키마
 * 생성 DTO의 모든 필드를 선택사항으로 변경
 */
export const UpdateCategorySchema = withExample(
  CategoryMasterSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }).partial(),
  {
    name: '웹 개발',
    description: '웹 개발 관련 최신 기술과 트렌드',
    order: 2,
  },
);

/**
 * 카테고리 비밀번호 변경 DTO 스키마 (해당 없음, 일관성을 위해 유지)
 * 카테고리는 비밀번호가 없으므로 빈 스키마
 */
export const ChangeCategoryPasswordSchema = CategoryMasterSchema.pick(
  {},
).optional();
