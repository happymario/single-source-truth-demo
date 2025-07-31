import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserDocument } from '../../../models/user.model';
import { AuthService } from '../auth.service';

/**
 * Local 인증 전략 (이메일/비밀번호 로그인)
 * passport-local을 사용하여 이메일과 비밀번호 검증
 *
 * 참고: AuthService는 다음 태스크에서 구현되므로,
 * 현재는 interface만 정의하고 실제 구현은 AuthService 완료 후 연결
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // 기본값인 'username' 대신 'email' 사용
      passwordField: 'password',
    });
  }

  /**
   * 이메일과 비밀번호를 통한 사용자 인증
   * @param email 이메일 주소
   * @param password 비밀번호
   * @returns 검증된 사용자 정보
   */
  async validate(email: string, password: string): Promise<UserDocument> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
