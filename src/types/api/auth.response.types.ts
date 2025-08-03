import { z } from 'zod';
import {
  TokenInfoSchema,
  LoginResponseSchema,
  RegisterResponseSchema,
  RefreshTokenResponseSchema,
  UpdateProfileResponseSchema,
  ChangePasswordResponseSchema,
  ForgotPasswordResponseSchema,
  ResetPasswordResponseSchema,
  VerifyEmailResponseSchema,
  LogoutResponseSchema,
  DeactivateAccountResponseSchema,
  MeResponseSchema,
  JwtPayloadSchema,
  AuthErrorResponseSchema,
} from '../../schemas/response/auth.response.schema';

/**
 * Auth API 응답 타입들 - z.infer로만 타입 추론
 * Single Source of Truth 원칙에 따라 모든 타입은 Zod 스키마에서 추론
 */

export type TokenInfo = z.infer<typeof TokenInfoSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponseSchema>;
export type ChangePasswordResponse = z.infer<
  typeof ChangePasswordResponseSchema
>;
export type ForgotPasswordResponse = z.infer<
  typeof ForgotPasswordResponseSchema
>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type DeactivateAccountResponse = z.infer<
  typeof DeactivateAccountResponseSchema
>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
