import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { ZodSchema, ZodObject } from 'zod';
import { zodToOpenAPI } from '../utils/zod-to-openapi';

/**
 * ZodParam과 함께 사용하여 Swagger 문서화를 추가하는 헬퍼 함수
 * 
 * @example
 * ```typescript
 * @Get(':id')
 * @ApiParamFromZod('id', ObjectIdSchema)
 * async findOne(@ZodParam(ObjectIdSchema) params: { id: string }) {
 *   return this.userService.findOne(params.id);
 * }
 * ```
 */
export function ApiParamFromZod(name: string, schema: ZodSchema & { _example?: any }): MethodDecorator {
  const openApiSchema = zodToOpenAPI(schema);
  
  const options: any = {
    name,
    schema: openApiSchema,
    required: true,
  };
  
  if (schema._example !== undefined) {
    options.example = schema._example;
  }
  
  if (openApiSchema.description) {
    options.description = openApiSchema.description;
  }
  
  return ApiParam(options);
}

/**
 * ZodQuery와 함께 사용하여 Swagger 문서화를 추가하는 헬퍼 함수
 * ZodObject의 각 필드를 개별 query parameter로 문서화합니다.
 * 
 * @example
 * ```typescript
 * @Get()
 * @ApiQueryFromZod(UserQuerySchema)
 * async findAll(@ZodQuery(UserQuerySchema) query: UserQueryDto) {
 *   return this.userService.findAll(query);
 * }
 * ```
 */
export function ApiQueryFromZod(schema: ZodSchema & { _example?: any }): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // ZodObject인 경우 각 필드를 개별 query parameter로 문서화
    if (schema instanceof ZodObject) {
      const shape = schema.shape;
      const example = (schema as any)._example || {};
      
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const fieldOpenApi = zodToOpenAPI(fieldSchema as ZodSchema);
        const options: any = {
          name: key,
          schema: fieldOpenApi,
          required: false, // Query 파라미터는 대부분 선택사항
        };
        
        // Optional이 아니고 default가 없으면 required
        if (fieldOpenApi.nullable !== true && fieldOpenApi.default === undefined) {
          // ZodOptional이나 optional() 체크
          const fieldDef = (fieldSchema as any)._def;
          if (fieldDef && fieldDef.typeName !== 'ZodOptional') {
            options.required = true;
          }
        }
        
        if (example[key] !== undefined) {
          options.example = example[key];
        }
        
        if (fieldOpenApi.description) {
          options.description = fieldOpenApi.description;
        }
        
        // 각 필드에 대해 ApiQuery 적용
        ApiQuery(options)(target, propertyKey, descriptor);
      }
    } else {
      // 단일 스키마인 경우
      const openApiSchema = zodToOpenAPI(schema);
      const options: any = {
        schema: openApiSchema,
        required: false,
      };
      
      if ((schema as any)._example !== undefined) {
        options.example = (schema as any)._example;
      }
      
      ApiQuery(options)(target, propertyKey, descriptor);
    }
  };
}

/**
 * 여러 파라미터를 한번에 문서화하는 헬퍼 함수
 * 
 * @example
 * ```typescript
 * @Get(':userId/posts/:postId')
 * @ApiParamsFromZod({
 *   userId: ObjectIdSchema,
 *   postId: ObjectIdSchema
 * })
 * async findUserPost(@ZodParam(UserPostParamsSchema) params: UserPostParamsDto) {
 *   return this.postsService.findUserPost(params);
 * }
 * ```
 */
export function ApiParamsFromZod(params: Record<string, ZodSchema & { _example?: any }>): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    for (const [name, schema] of Object.entries(params)) {
      ApiParamFromZod(name, schema)(target, propertyKey, descriptor);
    }
  };
}