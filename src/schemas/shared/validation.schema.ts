import { z } from 'zod';
import validator from 'validator';

/**
 * 커스텀 검증 함수 모음 (validator 라이브러리에 없는 경우만)
 */

/**
 * MongoDB ObjectId 검증
 */
export const isMongoObjectId = (value: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * Slug 형식 검증 (소문자, 숫자, 하이픈만 허용)
 */
export const isValidSlug = (value: string): boolean => {
  return /^[a-z0-9-]+$/.test(value) && validator.isLength(value, { min: 1, max: 100 });
};

/**
 * 사용자 이름 검증 (한글, 영문, 숫자, 공백 허용)
 */
export const isValidUserName = (value: string): boolean => {
  return /^[a-zA-Z0-9가-힣\s]+$/.test(value) && validator.isLength(value, { min: 1, max: 50 });
};

/**
 * 태그 검증
 */
export const isValidTag = (value: string): boolean => {
  return /^[a-zA-Z0-9가-힣]+$/.test(value) && validator.isLength(value, { min: 1, max: 30 });
};

/**
 * 공통 검증 스키마 정의
 */

/**
 * 이메일 스키마
 */
export const EmailSchema = z.string().refine(
  validator.isEmail,
  'Invalid email format',
);

/**
 * URL 스키마
 */
export const UrlSchema = z.string().refine(
  validator.isURL,
  'Invalid URL format',
);

/**
 * 강력한 패스워드 스키마
 */
export const StrongPasswordSchema = z.string().refine(
  (val) => validator.isStrongPassword(val, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),
  'Password must be at least 8 characters long and contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
);

/**
 * 헥스 컬러 스키마
 */
export const HexColorSchema = z.string().refine(
  validator.isHexColor,
  'Invalid hex color format',
);

/**
 * 슬러그 스키마
 */
export const SlugSchema = z.string().refine(
  isValidSlug,
  'Slug must contain only lowercase letters, numbers, and hyphens (1-100 characters)',
);

/**
 * 사용자 이름 스키마
 */
export const UserNameSchema = z.string().refine(
  isValidUserName,
  'Name must contain only letters, numbers, and spaces (1-50 characters)',
);

/**
 * 태그 스키마
 */
export const TagSchema = z.string().refine(
  isValidTag,
  'Tag must contain only letters and numbers (1-30 characters)',
);