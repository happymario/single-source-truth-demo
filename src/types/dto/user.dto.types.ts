import { z } from 'zod';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  LoginSchema,
  RegisterSchema,
} from '../../schemas/dto/user.dto.schema';
import { UserQuerySchema } from '../../schemas/query/user.query.schema';

/**
 * 사용자 생성 DTO 타입
 */
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * 사용자 수정 DTO 타입
 */
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * 비밀번호 변경 DTO 타입
 */
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

/**
 * 로그인 DTO 타입
 */
export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * 회원가입 DTO 타입
 */
export type RegisterDto = z.infer<typeof RegisterSchema>;

/**
 * 사용자 쿼리 DTO 타입
 */
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
