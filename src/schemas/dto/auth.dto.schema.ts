import { z } from 'zod';
import validator from 'validator';
import { UserMasterSchema } from '../master/user.schema';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 로그인 요청 DTO 스키마
 * UserMasterSchema에서 email과 password만 필요
 */
export const LoginDtoSchema = withExample(
  UserMasterSchema.pick({
    email: true,
    password: true,
  }),
  {
    email: 'user@example.com',
    password: 'SecurePass123!',
  },
);

/**
 * 회원가입 요청 DTO 스키마
 * 타임스탬프와 ID를 제외한 필수 필드들
 */
export const RegisterDtoSchema = withExample(
  UserMasterSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
    isActive: true, // 기본값이 있으므로 선택사항
    role: true, // 기본값이 있으므로 선택사항
  }),
  {
    email: 'newuser@example.com',
    password: 'MySecurePass123!',
    name: '김철수',
    bio: '안녕하세요, 신규 개발자입니다.',
    avatar: 'https://example.com/avatar-new.jpg',
  },
);

/**
 * 비밀번호 변경 요청 DTO 스키마
 */
export const ChangePasswordDtoSchema = withExample(
  z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().refine(
      (val) =>
        validator.isStrongPassword(val, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        }),
      'New password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
    ),
  }),
  {
    currentPassword: 'OldPass123!',
    newPassword: 'NewSecurePass456!',
  },
);

/**
 * 비밀번호 재설정 요청 DTO 스키마
 */
export const ForgotPasswordDtoSchema = z.object({
  email: z.string().refine(validator.isEmail, 'Invalid email format'),
});

/**
 * 비밀번호 재설정 확인 DTO 스키마
 */
export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().refine(
    (val) =>
      validator.isStrongPassword(val, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
    'New password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
  ),
});

/**
 * 프로필 업데이트 DTO 스키마
 * 비밀번호와 시스템 필드들을 제외한 업데이트 가능한 필드들
 */
export const UpdateProfileDtoSchema = UserMasterSchema.omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  role: true, // 관리자만 변경 가능
}).partial(); // 모든 필드를 선택사항으로 만듦

/**
 * 관리자용 사용자 업데이트 DTO 스키마
 */
export const AdminUpdateUserDtoSchema = UserMasterSchema.omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
}).partial();

/**
 * 이메일 인증 요청 DTO 스키마
 */
export const VerifyEmailDtoSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * 리프레시 토큰 DTO 스키마
 */
export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
