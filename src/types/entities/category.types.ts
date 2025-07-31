import { z } from 'zod';
import { CategoryMasterSchema } from '../../schemas/master/category.schema';

/**
 * Category 엔티티 타입
 * 마스터 스키마에서 추론
 */
export type Category = z.infer<typeof CategoryMasterSchema>;
