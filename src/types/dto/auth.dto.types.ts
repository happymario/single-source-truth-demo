import { z } from 'zod';
import {
  LoginDtoSchema,
  RegisterDtoSchema,
  ChangePasswordDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
  UpdateProfileDtoSchema,
  AdminUpdateUserDtoSchema,
  VerifyEmailDtoSchema,
  RefreshTokenDtoSchema,
} from '../../schemas/dto/auth.dto.schema';

/**
 * Auth DTO 타입들 - z.infer로만 타입 추론
 * Single Source of Truth 원칙에 따라 모든 타입은 Zod 스키마에서 추론
 */

export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;
export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserDtoSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;
