import { z } from 'zod';
import {
  UserResponseSchema,
  UserListResponseSchema,
  SingleUserResponseSchema,
  ProfileResponseSchema,
} from '../../schemas/response/user.response.schema';

/**
 * 사용자 응답 타입 (비밀번호 제외)
 */
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * 사용자 목록 응답 타입 (페이지네이션 포함)
 */
export type UserListResponse = z.infer<typeof UserListResponseSchema>;

/**
 * 단일 사용자 응답 타입
 */
export type SingleUserResponse = z.infer<typeof SingleUserResponseSchema>;

/**
 * 프로필 응답 타입
 */
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;