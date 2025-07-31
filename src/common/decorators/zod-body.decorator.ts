import { createParamDecorator, ExecutionContext, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Request Body를 Zod 스키마로 검증하는 데코레이터
 * 
 * @example
 * ```typescript
 * @Post()
 * @ZodBody(CreateUserSchema)
 * async create(@Body() dto: CreateUserDto) {
 *   return this.userService.create(dto);
 * }
 * ```
 */
export function ZodBody(schema: ZodSchema): MethodDecorator {
  return UsePipes(new ZodValidationPipe(schema));
}