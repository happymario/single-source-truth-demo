import { UserMasterSchema } from '../master/user.schema';
import {
  createPaginatedResponseSchema,
  createResponseSchema,
} from '../shared/common.schema';

/**
 * 사용자 응답 스키마 (비밀번호 제외)
 */
export const UserResponseSchema = UserMasterSchema.omit({
  password: true,
} as const);

/**
 * 사용자 목록 응답 스키마 (페이지네이션 포함)
 */
export const UserListResponseSchema =
  createPaginatedResponseSchema(UserResponseSchema);

/**
 * 단일 사용자 응답 스키마
 */
export const SingleUserResponseSchema =
  createResponseSchema(UserResponseSchema);

/**
 * 프로필 응답 스키마 (로그인한 사용자 본인)
 */
export const ProfileResponseSchema = UserResponseSchema;
