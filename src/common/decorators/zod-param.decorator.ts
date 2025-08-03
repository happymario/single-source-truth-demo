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
  (data: { key: string; schema: ZodSchema } | ZodSchema, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      params: Record<string, string>;
    }>();
    
    // 단일 스키마로 전체 params 검증하는 경우
    if ('_def' in data) {
      const schema = data as ZodSchema;
      const pipe = new ZodValidationPipe(schema);
      return pipe.transform(request.params, {
        type: 'param',
        data: undefined,
        metatype: undefined,
      });
    }
    
    // key와 schema가 제공된 경우 (레거시 지원)
    if (data && typeof data === 'object' && 'key' in data && 'schema' in data) {
      const param = request.params[data.key];
      const pipe = new ZodValidationPipe(data.schema);
      return pipe.transform(param, {
        type: 'param',
        data: undefined,
        metatype: undefined,
      });
    }
    
    return request.params;
  },
);
