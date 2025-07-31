import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Route 파라미터를 Zod 스키마로 검증하는 데코레이터
 * 
 * @example
 * ```typescript
 * @Get(':id')
 * async findOne(@ZodParam('id', ObjectIdSchema) id: string) {
 *   return this.userService.findOne(id);
 * }
 * ```
 */
export const ZodParam = createParamDecorator(
  (data: { key: string; schema: ZodSchema }, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const param = data.key ? request.params[data.key] : request.params;

    if (data.schema) {
      const pipe = new ZodValidationPipe(data.schema);
      return pipe.transform(param, { type: 'param' } as any);
    }

    return param;
  },
);