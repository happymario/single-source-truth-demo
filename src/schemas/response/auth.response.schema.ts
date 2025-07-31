import { z } from 'zod';
import { UserResponseSchema } from './user.response.schema';

/**
 * JWT 토큰 정보 스키마
 */
export const TokenInfoSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().positive('Expires in must be positive'),
});

/**
 * 로그인 응답 스키마
 * 토큰 정보와 사용자 정보를 포함
 */
export const LoginResponseSchema = z.object({
  user: UserResponseSchema,
  tokens: TokenInfoSchema,
});

/**
 * 회원가입 응답 스키마
 * 사용자 정보와 토큰 정보를 포함 (이메일 인증이 필요한 경우 토큰은 선택사항)
 */
export const RegisterResponseSchema = z.object({
  user: UserResponseSchema,
  tokens: TokenInfoSchema.optional(),
  message: z.string().optional(),
  requiresEmailVerification: z.boolean().default(false),
});

/**
 * 토큰 갱신 응답 스키마
 */
export const RefreshTokenResponseSchema = TokenInfoSchema;

/**
 * 프로필 업데이트 응답 스키마
 */
export const UpdateProfileResponseSchema = z.object({
  user: UserResponseSchema,
  message: z.string().default('Profile updated successfully'),
});

/**
 * 비밀번호 변경 응답 스키마
 */
export const ChangePasswordResponseSchema = z.object({
  message: z.string().default('Password changed successfully'),
});

/**
 * 비밀번호 재설정 요청 응답 스키마
 */
export const ForgotPasswordResponseSchema = z.object({
  message: z.string().default('Password reset email sent'),
});

/**
 * 비밀번호 재설정 확인 응답 스키마
 */
export const ResetPasswordResponseSchema = z.object({
  message: z.string().default('Password reset successfully'),
});

/**
 * 이메일 인증 응답 스키마
 */
export const VerifyEmailResponseSchema = z.object({
  user: UserResponseSchema,
  tokens: TokenInfoSchema.optional(),
  message: z.string().default('Email verified successfully'),
});

/**
 * 로그아웃 응답 스키마
 */
export const LogoutResponseSchema = z.object({
  message: z.string().default('Logged out successfully'),
});

/**
 * 계정 비활성화 응답 스키마
 */
export const DeactivateAccountResponseSchema = z.object({
  message: z.string().default('Account deactivated successfully'),
});

/**
 * 현재 사용자 정보 응답 스키마
 */
export const MeResponseSchema = UserResponseSchema;

/**
 * JWT 페이로드 스키마 (내부 사용)
 */
export const JwtPayloadSchema = z.object({
  sub: z.string(), // User ID
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

/**
 * Auth 에러 응답 스키마
 */
export const AuthErrorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
  timestamp: z.string(),
  path: z.string(),
});
