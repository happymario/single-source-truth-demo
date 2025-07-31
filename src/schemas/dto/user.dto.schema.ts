import { z } from 'zod';
import { UserMasterSchema } from '../master/user.schema';

/**
 * 사용자 생성 DTO 스키마
 * id, createdAt, updatedAt, lastLoginAt 필드 제외
 */
export const CreateUserSchema = UserMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

/**
 * 사용자 수정 DTO 스키마
 * id, createdAt, updatedAt, lastLoginAt 필드 제외하고 모든 필드 선택사항
 * password는 수정 시 포함하지 않음 (별도 엔드포인트에서 처리)
 */
export const UpdateUserSchema = UserMasterSchema
  .omit({
    id: true,
    password: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
  })
  .partial();

/**
 * 비밀번호 변경 DTO 스키마
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: UserMasterSchema.shape.password,
});

/**
 * 로그인 DTO 스키마
 */
export const LoginSchema = z.object({
  email: UserMasterSchema.shape.email,
  password: z.string().min(1, 'Password is required'),
});

/**
 * 회원가입 DTO 스키마 (CreateUserSchema와 동일하지만 명시적으로 정의)
 */
export const RegisterSchema = CreateUserSchema;