import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../../models/user.model';

/**
 * Request interface with user property
 */
interface RequestWithUser {
  user: UserDocument;
}

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
  (_data: unknown, context: ExecutionContext): UserDocument => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
