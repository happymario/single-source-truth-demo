import { z } from 'zod';
import validator from 'validator';
import { ObjectIdSchema, TimestampsSchema } from '../shared/common.schema';

/**
 * User 엔티티의 마스터 스키마
 * 모든 User 관련 타입의 Single Source of Truth
 */
export const UserMasterSchema = z.object({
  /**
   * MongoDB ObjectId (문자열로 표현)
   */
  id: ObjectIdSchema,

  /**
   * 이메일 주소 (고유값)
   */
  email: z.string().refine(validator.isEmail, 'Invalid email format'),

  /**
   * 비밀번호 (해시된 값)
   */
  password: z.string().refine(
    (val) => validator.isStrongPassword(val, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
    'Password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
  ),

  /**
   * 사용자 이름
   */
  name: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters',
  ),

  /**
   * 자기소개 (선택)
   */
  bio: z.string().refine(
    (val) => !val || validator.isLength(val, { max: 500 }),
    'Bio must be less than 500 characters',
  ).optional(),

  /**
   * 프로필 이미지 URL (선택)
   */
  avatar: z.string().refine(validator.isURL, 'Invalid URL format').optional(),

  /**
   * 사용자 권한
   */
  role: z.enum(['user', 'admin']).default('user'),

  /**
   * 계정 활성화 상태
   */
  isActive: z.boolean().default(true),

  /**
   * 마지막 로그인 시간 (선택)
   */
  lastLoginAt: z.date().optional(),
}).merge(TimestampsSchema);

/**
 * User 엔티티 타입 (타입 추론용)
 */
export type UserMaster = z.infer<typeof UserMasterSchema>;