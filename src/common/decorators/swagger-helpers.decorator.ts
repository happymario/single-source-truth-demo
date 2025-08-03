import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { ZodSchema, ZodObject } from 'zod';
import { zodToOpenAPI } from '../utils/zod-to-openapi';

/**
 * OpenAPI 스키마 타입 정의
 */
interface OpenAPISchema {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer';
  enum?: string[];
  description?: string;
  example?: unknown;
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  nullable?: boolean;
  oneOf?: OpenAPISchema[];
  const?: unknown;
  default?: unknown;
}

/**
 * API 파라미터 설정 타입 정의
 */
interface ApiParamConfig {
  name: string;
  schema: OpenAPISchema;
  required: boolean;
  example?: unknown;
  description?: string;
}

/**
 * API 쿼리 설정 타입 정의
 */
interface ApiQueryConfig {
  name: string;
  type?: NumberConstructor | StringConstructor | BooleanConstructor;
  enum?: string[];
  example?: unknown;
  description?: string;
  required: boolean;
}

/**
 * 타입 가드 함수들
 */

/**
 * ZodObject인지 확인하는 타입 가드
 */
function isZodObject(schema: ZodSchema): schema is ZodObject<any> {
  return schema instanceof ZodObject;
}

/**
 * Zod 스키마가 _def 속성을 가지고 있는지 확인하는 타입 가드
 */
function hasZodDef(schema: unknown): schema is { _def: any } {
  return typeof schema === 'object' && schema !== null && '_def' in schema;
}

/**
 * OpenAPI 스키마가 유효한 타입인지 확인하는 검증 함수
 */
function isValidOpenAPIType(schema: unknown): schema is OpenAPISchema {
  if (typeof schema !== 'object' || schema === null) {
    return false;
  }

  const openApiSchema = schema as OpenAPISchema;
  const validTypes = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'integer',
  ];

  return (
    openApiSchema.type === undefined || validTypes.includes(openApiSchema.type)
  );
}

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
export function ApiParamFromZod(
  name: string,
  schema: ZodSchema & { _example?: any },
): MethodDecorator {
  const openApiSchema = zodToOpenAPI(schema);

  const options: ApiParamConfig = {
    name,
    schema: openApiSchema,
    required: true,
  };

  if ('_example' in schema && schema._example !== undefined) {
    options.example = schema._example;
  }

  if (isValidOpenAPIType(openApiSchema) && openApiSchema.description) {
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
export function ApiQueryFromZod(
  schema: ZodSchema & { _example?: any },
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    // ZodObject인 경우 각 필드를 개별 query parameter로 문서화
    if (schema instanceof ZodObject) {
      const shape = schema.shape;
      const example = extractExampleFromSchema(schema);

      for (const [key, fieldSchema] of Object.entries(shape)) {
        const fieldOpenApi = zodToOpenAPI(fieldSchema as ZodSchema);

        // 디버깅용 로그
        console.log(`Field: ${key}`, {
          fieldSchema: fieldSchema._def,
          fieldOpenApi,
          example: example ? example[key] : undefined,
        });

        // ApiQuery는 스칼라 값만 받으므로 type과 example만 추출
        const options: any = {
          name: key,
          required: false, // Query 파라미터는 대부분 선택사항
        };

        // 타입 설정 - ApiQuery가 기대하는 형식으로
        if (fieldOpenApi.type === 'number') {
          options.type = Number;
        } else if (fieldOpenApi.type === 'boolean') {
          options.type = Boolean;
        } else if (fieldOpenApi.type === 'string') {
          options.type = String;
        }

        // enum 처리
        if (fieldOpenApi.enum) {
          options.enum = fieldOpenApi.enum;
        }

        // Query 파라미터는 기본적으로 모두 optional로 설정
        // 왜냐하면 일반적으로 GET 요청의 query parameter는 필수가 아니기 때문
        options.required = false;

        // 특별히 required가 필요한 경우만 true로 설정하는 로직을 추가할 수 있음
        // 현재는 모든 query parameter를 optional로 처리

        if (example && example[key] !== undefined) {
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
 * 스키마에서 example 값을 추출하는 헬퍼 함수
 * 중첩된 스키마(extend, merge)에서도 example을 찾음
 */
function extractExampleFromSchema(schema: any): any {
  // 직접 _example이 있는 경우
  if (schema._example) {
    return schema._example;
  }

  // ZodObject의 경우 shape에서 각 필드의 example 수집
  if (schema instanceof ZodObject) {
    const shape = schema.shape;
    const result: any = {};

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const fieldExample = extractExampleFromSchema(fieldSchema);
      if (fieldExample !== undefined) {
        result[key] = fieldExample;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  // ZodDefault의 경우 기본값 사용
  if (schema._def?.typeName === 'ZodDefault') {
    return schema._def.defaultValue();
  }

  // ZodEffects (withExample로 감싸진 경우)
  if (schema._def?.typeName === 'ZodEffects') {
    return extractExampleFromSchema(schema._def.schema);
  }

  return undefined;
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
export function ApiParamsFromZod(
  params: Record<string, ZodSchema & { _example?: any }>,
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    for (const [name, schema] of Object.entries(params)) {
      ApiParamFromZod(name, schema)(target, propertyKey, descriptor);
    }
  };
}
