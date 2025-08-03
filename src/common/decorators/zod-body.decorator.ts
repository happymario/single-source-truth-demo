import { UsePipes, applyDecorators } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { zodToOpenAPI } from '../utils/zod-to-openapi';

/**
 * Request Body를 Zod 스키마로 검증하는 데코레이터
 * Swagger 문서에 자동으로 스키마를 표시합니다.
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
  return applyDecorators(
    ApiBody({
      schema: zodToOpenAPI(schema),
    }),
    UsePipes(new ZodValidationPipe(schema)),
  );
}
