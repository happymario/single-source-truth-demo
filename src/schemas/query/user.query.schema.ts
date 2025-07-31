import { z } from 'zod';
import { BaseQuerySchema } from '../shared/common.schema';

/**
 * 사용자 목록 조회 쿼리 스키마
 */
export const UserQuerySchema = BaseQuerySchema.extend({
  /**
   * 이름으로 검색
   */
  name: z.string().optional(),
  
  /**
   * 이메일로 검색
   */
  email: z.string().optional(),
  
  /**
   * 권한으로 필터링
   */
  role: z.enum(['user', 'admin']).optional(),
  
  /**
   * 활성화 상태로 필터링
   */
  isActive: z.coerce.boolean().optional(),
  
  /**
   * 정렬 필드 (기본값: createdAt)
   */
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt', 'lastLoginAt']).default('createdAt'),
});