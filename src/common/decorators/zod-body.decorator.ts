import { UsePipes, applyDecorators } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { zodToOpenAPI } from '../utils/zod-to-openapi';

/**
 * OpenAPISchema를 SchemaObject로 변환하는 타입 안전한 함수
 */
function convertToSchemaObject(
  openApiSchema: ReturnType<typeof zodToOpenAPI>,
): SchemaObject {
  const {
    allOf,
    oneOf,
    anyOf,
    not,
    properties,
    items,
    additionalProperties,
    exclusiveMaximum,
    exclusiveMinimum,
    ...basicProps
  } = openApiSchema;

  const schemaObject: SchemaObject = {
    ...basicProps,
    // exclusiveMaximum/exclusiveMinimum은 OpenAPI 3.0에서 boolean이지만 우리는 number를 사용하므로 변환
    ...(exclusiveMaximum !== undefined && {
      exclusiveMaximum: true,
      maximum: exclusiveMaximum,
    }),
    ...(exclusiveMinimum !== undefined && {
      exclusiveMinimum: true,
      minimum: exclusiveMinimum,
    }),
  };

  // 재귀적으로 변환이 필요한 속성들 처리
  if (allOf) {
    schemaObject.allOf = allOf.map(convertToSchemaObject);
  }

  if (oneOf) {
    schemaObject.oneOf = oneOf.map(convertToSchemaObject);
  }

  if (anyOf) {
    schemaObject.anyOf = anyOf.map(convertToSchemaObject);
  }

  if (not) {
    schemaObject.not = convertToSchemaObject(not);
  }

  if (properties) {
    schemaObject.properties = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        acc[key] = convertToSchemaObject(value);
        return acc;
      },
      {} as Record<string, SchemaObject>,
    );
  }

  if (items) {
    schemaObject.items = convertToSchemaObject(items);
  }

  if (additionalProperties && typeof additionalProperties === 'object') {
    schemaObject.additionalProperties =
      convertToSchemaObject(additionalProperties);
  } else if (typeof additionalProperties === 'boolean') {
    schemaObject.additionalProperties = additionalProperties;
  }

  return schemaObject;
}

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
      schema: convertToSchemaObject(zodToOpenAPI(schema)),
    }),
    UsePipes(new ZodValidationPipe(schema)),
  );
}
