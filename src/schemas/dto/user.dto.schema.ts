import { z } from 'zod';
import { UserMasterSchema } from '../master/user.schema';
import { withExample } from '../../common/utils/zod-with-example';

/**
 * 사용자 생성 DTO 스키마
 * id, createdAt, updatedAt, lastLoginAt 필드 제외
 */
export const CreateUserSchema = withExample(
  UserMasterSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
  }),
  {
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: '홍길동',
    bio: '안녕하세요, 개발자 홍길동입니다.',
    avatar: 'https://example.com/avatar.jpg',
    role: 'user',
    isActive: true,
  },
);

/**
 * 사용자 수정 DTO 스키마
 * id, createdAt, updatedAt, lastLoginAt 필드 제외하고 모든 필드 선택사항
 * password는 수정 시 포함하지 않음 (별도 엔드포인트에서 처리)
 */
export const UpdateUserSchema = withExample(
  UserMasterSchema.omit({
    id: true,
    password: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
  }).partial(),
  {
    name: '김철수',
    bio: '프로필 정보를 업데이트했습니다.',
    avatar: 'https://example.com/new-avatar.jpg',
  },
);

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
export const LoginSchema = withExample(
  z.object({
    email: UserMasterSchema.shape.email,
    password: z.string().min(1, 'Password is required'),
  }),
  {
    email: 'user@example.com',
    password: 'SecurePass123!',
  },
);

/**
 * 회원가입 DTO 스키마 (CreateUserSchema와 동일하지만 명시적으로 정의)
 */
export const RegisterSchema = CreateUserSchema;
