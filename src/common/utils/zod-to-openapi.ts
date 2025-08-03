import {
  ZodSchema,
  ZodObject,
  ZodArray,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNullable,
  ZodOptional,
  ZodUnion,
  ZodLiteral,
} from 'zod';

/**
 * Zod 스키마를 OpenAPI 3.0 스키마로 변환합니다.
 */
export function zodToOpenAPI(schema: ZodSchema & { _example?: any }): any {
  const result = convertSchema(schema);

  // _example 메타데이터가 있으면 추가
  if (schema._example !== undefined) {
    result.example = schema._example;
  }

  return result;
}

/**
 * 실제 스키마 변환 로직
 */
function convertSchema(schema: ZodSchema): any {
  if (schema instanceof ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = convertSchema(value as ZodSchema);

      // Optional이 아닌 필드는 required에 추가
      if (!(value instanceof ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
    };
  }

  if (schema instanceof ZodArray) {
    return {
      type: 'array',
      items: convertSchema((schema as any)._def.type),
    };
  }

  if (schema instanceof ZodString) {
    const checks = (schema as any)._def.checks || [];
    const result: any = { type: 'string' };

    for (const check of checks) {
      if (check.kind === 'email') {
        result.format = 'email';
      } else if (check.kind === 'url') {
        result.format = 'url';
      } else if (check.kind === 'uuid') {
        result.format = 'uuid';
      } else if (check.kind === 'min') {
        result.minLength = check.value;
      } else if (check.kind === 'max') {
        result.maxLength = check.value;
      } else if (check.kind === 'regex') {
        result.pattern = check.regex.source;
      }
    }

    return result;
  }

  if (schema instanceof ZodNumber) {
    const checks = (schema as any)._def.checks || [];
    const result: any = { type: 'number' };

    for (const check of checks) {
      if (check.kind === 'min') {
        result.minimum = check.value;
      } else if (check.kind === 'max') {
        result.maximum = check.value;
      } else if (check.kind === 'int') {
        result.type = 'integer';
      }
    }

    return result;
  }

  if (schema instanceof ZodBoolean) {
    return { type: 'boolean' };
  }

  if (schema instanceof ZodDate) {
    return { type: 'string', format: 'date-time' };
  }

  if (schema instanceof ZodEnum) {
    return {
      type: 'string',
      enum: schema.options,
    };
  }

  if (schema instanceof ZodLiteral) {
    return {
      type:
        typeof schema.value === 'string'
          ? 'string'
          : typeof schema.value === 'number'
            ? 'number'
            : 'boolean',
      const: schema.value,
    };
  }

  if (schema instanceof ZodNullable) {
    const innerSchema = convertSchema((schema as any)._def.innerType);
    return {
      ...innerSchema,
      nullable: true,
    };
  }

  if (schema instanceof ZodOptional) {
    return convertSchema((schema as any)._def.innerType);
  }

  if (schema instanceof ZodUnion) {
    const options = (schema as any)._def.options;
    return {
      oneOf: options.map((option: ZodSchema) => convertSchema(option)),
    };
  }

  // 기본값
  return { type: 'object' };
}
