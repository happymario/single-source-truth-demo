import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UserDocument } from '../../models/user.model';
// DTO 타입들은 Zod 스키마에서 직접 파싱하여 사용하므로 import 불필요
import type {
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  MeResponse,
  LogoutResponse,
} from '../../types/api/auth.response.types';
import {
  LoginDtoSchema,
  RegisterDtoSchema,
  ChangePasswordDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
  UpdateProfileDtoSchema,
  RefreshTokenDtoSchema,
} from '../../schemas/dto/auth.dto.schema';
import { UserMapper } from '../../common/mappers/user.mapper';

/**
 * 인증 컨트롤러
 * 사용자 인증, 회원가입, 로그인, 프로필 관리 엔드포인트 제공
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 회원가입
   * @param body 회원가입 정보
   * @returns 등록된 사용자 정보와 토큰
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: unknown): Promise<RegisterResponse> {
    const registerDto = RegisterDtoSchema.parse(body);
    return this.authService.register(registerDto);
  }

  /**
   * 사용자 로그인
   * @param user 인증된 사용자 (LocalAuthGuard에서 주입)
   * @param body 로그인 정보 (DTO 검증용)
   * @returns 사용자 정보와 토큰
   */
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: UserDocument,
    @Body() body: unknown,
  ): Promise<LoginResponse> {
    // LocalAuthGuard에서 이미 인증된 사용자를 받아 로그인 처리
    const loginDto = LoginDtoSchema.parse(body);
    return this.authService.login(loginDto);
  }

  /**
   * 토큰 갱신
   * @param body 리프레시 토큰 정보
   * @returns 새로운 토큰 정보
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() body: unknown): Promise<RefreshTokenResponse> {
    const refreshTokenDto = RefreshTokenDtoSchema.parse(body);
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * 로그아웃
   * @returns 로그아웃 완료 메시지
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(): LogoutResponse {
    // 실제 구현에서는 토큰 블랙리스트 처리 등이 필요할 수 있음
    return { message: 'Logged out successfully' };
  }

  /**
   * 현재 인증된 사용자 정보 조회
   * @param user 현재 인증된 사용자
   * @returns 사용자 정보
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: UserDocument): MeResponse {
    return UserMapper.documentToResponse(user);
  }

  /**
   * 프로필 업데이트
   * @param user 현재 인증된 사용자
   * @param body 프로필 업데이트 정보
   * @returns 업데이트된 사용자 정보
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() body: unknown,
  ): Promise<UpdateProfileResponse> {
    const updateProfileDto = UpdateProfileDtoSchema.parse(body);
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * 비밀번호 변경
   * @param user 현재 인증된 사용자
   * @param body 비밀번호 변경 정보
   * @returns 변경 완료 메시지
   */
  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() body: unknown,
  ): Promise<ChangePasswordResponse> {
    const changePasswordDto = ChangePasswordDtoSchema.parse(body);
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * 비밀번호 재설정 요청
   * @param body 비밀번호 재설정 요청 정보
   * @returns 요청 완료 메시지
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: unknown): Promise<ForgotPasswordResponse> {
    const forgotPasswordDto = ForgotPasswordDtoSchema.parse(body);
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return { message: result.message };
  }

  /**
   * 비밀번호 재설정 확인
   * @param body 비밀번호 재설정 정보
   * @returns 재설정 완료 메시지
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown): Promise<ResetPasswordResponse> {
    const resetPasswordDto = ResetPasswordDtoSchema.parse(body);
    const result = await this.authService.resetPassword(resetPasswordDto);
    return { message: result.message };
  }

  /**
   * 계정 비활성화
   * @param user 현재 인증된 사용자
   * @returns 비활성화 완료 메시지
   */
  @Put('deactivate')
  @UseGuards(JwtAuthGuard)
  deactivateAccount(): { message: string } {
    // 실제 구현에서는 계정 비활성화 로직 추가
    // await this.authService.deactivateAccount(user.id);
    return { message: 'Account deactivated successfully' };
  }
}
