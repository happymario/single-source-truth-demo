import { z } from 'zod';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 사용자 목록 조회 쿼리 스키마
 */
export const UserQuerySchema = withExample(
  z.object({
    // 페이지네이션
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    
    // 정렬
    sortBy: z
      .enum(['name', 'email', 'createdAt', 'updatedAt', 'lastLoginAt'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    
    // 검색 및 필터링
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
  }),
  {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    name: '홍',
    role: 'user',
    isActive: true,
  }
);
