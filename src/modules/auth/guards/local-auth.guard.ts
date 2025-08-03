import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local 인증 가드
 * 로그인 엔드포인트에서 이메일/비밀번호 검증에 사용
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
