import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../../models/user.model';

/**
 * CurrentUser 데코레이터
 * JWT 인증된 사용자 정보를 컨트롤러에서 쉽게 접근할 수 있도록 함
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: UserDocument) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserDocument => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
