import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 인증 가드
 * @Public 데코레이터가 적용된 엔드포인트는 인증을 건너뛰음
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 인증이 필요한지 확인
   * @param context 실행 컨텍스트
   * @returns 인증 활성화 여부
   */
  canActivate(context: ExecutionContext) {
    // @Public 데코레이터가 적용된 경우 인증 건너뛰기
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
