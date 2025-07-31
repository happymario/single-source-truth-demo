import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModel, UserSchema } from '../../models/user.model';

/**
 * 인증 모듈
 * JWT 기반 인증 시스템과 관련된 모든 컴포넌트를 포함
 */
@Module({
  imports: [
    // Passport 모듈 설정
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 모듈 설정
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '15m',
      },
    }),

    // User 모델 등록
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
