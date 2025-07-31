import { createParamDecorator, ExecutionContext, PipeTransform, Type } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Query 파라미터를 Zod 스키마로 검증하는 데코레이터
 * 
 * @example
 * ```typescript
 * @Get()
 * async findAll(@ZodQuery(PaginationSchema) query: PaginationDto) {
 *   return this.userService.findAll(query);
 * }
 * ```
 */
export const ZodQuery = createParamDecorator(
  (schema: ZodSchema, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    if (schema) {
      const pipe = new ZodValidationPipe(schema);
      return pipe.transform(query, { type: 'query' } as any);
    }

    return query;
  },
);