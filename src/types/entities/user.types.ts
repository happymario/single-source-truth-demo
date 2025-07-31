import { z } from 'zod';
import { UserMasterSchema } from '../../schemas/master/user.schema';

/**
 * User 엔티티 타입 (마스터 스키마에서 추론)
 */
export type User = z.infer<typeof UserMasterSchema>;