import { SetMetadata } from '@nestjs/common';

/**
 * Public 데코레이터
 * JWT 인증을 건너뛰고 공개 액세스를 허용하는 엔드포인트에 사용
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
