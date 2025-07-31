import { z } from 'zod';
import validator from 'validator';
import { ObjectIdSchema } from '../shared/common.schema';
import { SlugSchema, HexColorSchema } from '../shared/validation.schema';

/**
 * Category 마스터 스키마
 * 게시물 분류를 위한 카테고리 정의
 */
export const CategoryMasterSchema = z.object({
  /**
   * 카테고리 고유 식별자
   */
  id: ObjectIdSchema,

  /**
   * 카테고리 이름 (1-50자, 한글/영문/숫자/공백 허용)
   */
  name: z
    .string()
    .refine(
      (val) => validator.isLength(val, { min: 1, max: 50 }),
      'Category name must be 1-50 characters long',
    )
    .refine(
      (val) => /^[a-zA-Z0-9가-힣\s]+$/.test(val),
      'Category name can only contain letters, numbers, Korean characters, and spaces',
    ),

  /**
   * 카테고리 슬러그 (URL 친화적 식별자)
   */
  slug: SlugSchema,

  /**
   * 카테고리 설명 (선택사항, 최대 500자)
   */
  description: z
    .string()
    .refine(
      (val) => validator.isLength(val, { min: 0, max: 500 }),
      'Description must be maximum 500 characters',
    )
    .optional(),

  /**
   * 카테고리 색상 (HEX 색상 코드)
   */
  color: HexColorSchema,

  /**
   * 카테고리 아이콘 (선택사항, 이모지 또는 아이콘 이름)
   */
  icon: z
    .string()
    .refine(
      (val) => validator.isLength(val, { min: 1, max: 10 }),
      'Icon must be 1-10 characters',
    )
    .optional(),

  /**
   * 부모 카테고리 ID (계층 구조 지원)
   */
  parentId: ObjectIdSchema.optional(),

  /**
   * 카테고리 순서 (정렬용)
   */
  order: z.number().int().min(0).max(9999).default(0),

  /**
   * 활성 상태
   */
  isActive: z.boolean().default(true),

  /**
   * 생성 일시
   */
  createdAt: z.date(),

  /**
   * 수정 일시
   */
  updatedAt: z.date(),
});

/**
 * CategoryMasterSchema 타입 검증
 */
export type CategoryMaster = z.infer<typeof CategoryMasterSchema>;
