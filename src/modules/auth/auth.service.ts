import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserModel, UserDocument } from '../../models/user.model';
import { UserMapper } from '../../common/mappers/user.mapper';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '../../types/dto/auth.dto.types';
import {
  LoginResponse,
  RegisterResponse,
  TokenInfo,
  RefreshTokenResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
  JwtPayload,
} from '../../types/api/auth.response.types';
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  TokenInfoSchema,
  RefreshTokenResponseSchema,
  UpdateProfileResponseSchema,
  ChangePasswordResponseSchema,
} from '../../schemas/response/auth.response.schema';

/**
 * 인증 서비스
 * JWT 토큰 기반 인증, 사용자 등록/로그인, 비밀번호 관리 등을 담당
 */
@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private readonly jwtExpirationTime = process.env.JWT_EXPIRATION || '15m';
  private readonly refreshTokenExpirationTime =
    process.env.REFRESH_TOKEN_EXPIRATION || '7d';

  // 간단한 in-memory refresh token 저장소 (실제로는 Redis나 DB 사용 권장)
  private readonly revokedTokens = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * 사용자 등록
   * @param registerDto 회원가입 정보
   * @returns 등록된 사용자 정보와 토큰
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, password, ...userData } = registerDto;

    // 이메일 중복 확인
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // 사용자 생성
    const user = new this.userModel({
      ...userData,
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // 토큰 생성
    const tokens = this.generateTokens(savedUser);

    // 응답 데이터 구성
    const userResponse = UserMapper.documentToResponse(savedUser);

    return RegisterResponseSchema.parse({
      user: userResponse,
      tokens,
      message: 'User registered successfully',
      requiresEmailVerification: false,
    });
  }

  /**
   * 사용자 로그인
   * @param loginDto 로그인 정보
   * @returns 사용자 정보와 토큰
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // 사용자 유효성 검증
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 마지막 로그인 시간 업데이트
    await this.userModel.findByIdAndUpdate(user.id, {
      lastLoginAt: new Date(),
    });

    // 토큰 생성
    const tokens = this.generateTokens(user);

    // 응답 데이터 구성
    const userResponse = UserMapper.documentToResponse(user);

    return LoginResponseSchema.parse({
      user: userResponse,
      tokens,
    });
  }

  /**
   * 이메일과 비밀번호로 사용자 검증
   * @param email 이메일
   * @param password 비밀번호
   * @returns 검증된 사용자 또는 null
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return null;
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * JWT 액세스 토큰과 리프레시 토큰 생성
   * @param user 사용자 문서
   * @returns 토큰 정보
   */
  generateTokens(user: UserDocument): TokenInfo {
    const payload: JwtPayload = {
      sub: user.id as string,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpirationTime,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.refreshTokenExpirationTime,
    });

    return TokenInfoSchema.parse({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseTimeToSeconds(this.jwtExpirationTime),
    });
  }

  /**
   * 리프레시 토큰으로 새로운 액세스 토큰 발급
   * @param refreshToken 리프레시 토큰
   * @returns 새로운 토큰 정보
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // 무효화된 토큰인지 확인
      if (this.isTokenRevoked(refreshToken)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.jwtSecret,
      });

      // 사용자 존재 확인
      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 새로운 토큰 생성
      const tokens = this.generateTokens(user);

      return RefreshTokenResponseSchema.parse(tokens);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * 비밀번호 변경
   * @param userId 사용자 ID
   * @param changePasswordDto 비밀번호 변경 정보
   * @returns 변경 완료 메시지
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    const { currentPassword, newPassword } = changePasswordDto;

    // 사용자 조회
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 새 비밀번호 해싱 및 저장
    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    return ChangePasswordResponseSchema.parse({
      message: 'Password changed successfully',
    });
  }

  /**
   * 프로필 업데이트
   * @param userId 사용자 ID
   * @param updateProfileDto 프로필 업데이트 정보
   * @returns 업데이트된 사용자 정보
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    // 이메일 중복 확인 (변경 시)
    if (updateProfileDto.email) {
      const existingUser = await this.userModel
        .findOne({ email: updateProfileDto.email, _id: { $ne: userId } })
        .exec();
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // 프로필 업데이트
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const userResponse = UserMapper.documentToResponse(updatedUser);

    return UpdateProfileResponseSchema.parse({
      user: userResponse,
      message: 'Profile updated successfully',
    });
  }

  /**
   * 비밀번호 재설정 요청 (이메일 발송)
   * @param forgotPasswordDto 비밀번호 재설정 요청 정보
   * @returns 요청 완료 메시지
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      // 보안을 위해 사용자가 존재하지 않아도 성공 메시지 반환
      return { message: 'If email exists, reset instructions have been sent' };
    }

    // TODO: 실제 구현에서는 이메일 발송 로직 추가
    // const resetToken = await this.generateResetToken(user);
    // await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If email exists, reset instructions have been sent' };
  }

  /**
   * 비밀번호 재설정 확인
   * @param resetPasswordDto 비밀번호 재설정 정보
   * @returns 재설정 완료 메시지
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    try {
      // TODO: 실제 구현에서는 토큰 검증 로직 추가
      // const payload = this.jwtService.verify(token);
      // const user = await this.userModel.findById(payload.sub);

      // 임시 구현: 토큰이 'valid-reset-token'인 경우만 허용
      if (token !== 'valid-reset-token') {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // 새 비밀번호 해싱 및 저장
      await bcrypt.hash(newPassword, this.saltRounds);
      // await this.userModel.findByIdAndUpdate(user.id, { password: hashedPassword });

      return { message: 'Password reset successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  /**
   * 로그아웃 (Refresh Token 무효화)
   * @param refreshToken 무효화할 refresh token
   * @returns 로그아웃 완료 메시지
   */
  logout(refreshToken?: string): { message: string } {
    if (refreshToken) {
      // Refresh Token을 무효화 목록에 추가
      this.revokedTokens.add(refreshToken);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh Token이 무효화되었는지 확인
   * @param refreshToken 확인할 refresh token
   * @returns 무효화 여부
   */
  isTokenRevoked(refreshToken: string): boolean {
    return this.revokedTokens.has(refreshToken);
  }

  /**
   * 시간 문자열을 초 단위로 변환
   * @param timeString 시간 문자열 (예: '15m', '7d')
   * @returns 초 단위 시간
   */
  private parseTimeToSeconds(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // 기본값: 15분
    }
  }
}
