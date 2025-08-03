import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel, UserDocument } from '../../../models/user.model';
import { JwtPayload } from '../../../types/api/auth.response.types';

/**
 * JWT 인증 전략
 * passport-jwt를 사용하여 JWT 토큰 검증
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  /**
   * JWT 페이로드 검증 및 사용자 정보 반환
   * @param payload JWT 페이로드
   * @returns 검증된 사용자 정보
   */
  async validate(payload: JwtPayload): Promise<UserDocument> {
    const { sub: userId } = payload;

    // 사용자 존재 여부 확인
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }
}
