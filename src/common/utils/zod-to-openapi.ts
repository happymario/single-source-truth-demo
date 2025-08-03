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
import { OpenAPISchema } from '../types/openapi.types';

/**
 * Zod 내부 타입 정의
 */
interface ZodDef {
  typeName: string;
  type?: string;
  [key: string]: unknown;
}

interface ZodSchemaWithDef {
  _def: ZodDef;
}

interface ZodCheck {
  kind: string;
  value?: number | string | boolean;
  message?: string;
  regex?: RegExp;
  [key: string]: unknown;
}

/**
 * 타입 가드 함수들
 */
function hasZodDef(schema: unknown): schema is ZodSchemaWithDef {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    '_def' in schema &&
    typeof (schema as ZodSchemaWithDef)._def === 'object' &&
    (schema as ZodSchemaWithDef)._def !== null
  );
}

function hasTypeName(schema: ZodSchemaWithDef, typeName: string): boolean {
  return (
    'typeName' in schema._def &&
    typeof schema._def.typeName === 'string' &&
    schema._def.typeName === typeName
  );
}

function isZodEffects(schema: unknown): boolean {
  return hasZodDef(schema) && hasTypeName(schema, 'ZodEffects');
}

function isZodDefault(schema: unknown): boolean {
  return hasZodDef(schema) && hasTypeName(schema, 'ZodDefault');
}

/**
 * Zod 스키마를 OpenAPI 3.0 스키마로 변환합니다.
 */
export function zodToOpenAPI(
  schema: ZodSchema & { _example?: unknown },
): OpenAPISchema {
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
function convertSchema(schema: ZodSchema): OpenAPISchema {
  // ZodEffects (z.coerce 등) 처리
  if (isZodEffects(schema)) {
    if (hasZodDef(schema) && 'schema' in schema._def) {
      const innerSchema = schema._def.schema as ZodSchema;
      const result = convertSchema(innerSchema);

      // coerce의 경우 타입 정보 유지
      if (
        hasZodDef(schema) &&
        'effect' in schema._def &&
        typeof schema._def.effect === 'object' &&
        schema._def.effect !== null &&
        'type' in schema._def.effect &&
        schema._def.effect.type === 'preprocess'
      ) {
        return result;
      }

      return result;
    }
  }

  // ZodDefault 처리
  if (isZodDefault(schema)) {
    if (hasZodDef(schema) && 'innerType' in schema._def) {
      const innerSchema = schema._def.innerType as ZodSchema;
      const result = convertSchema(innerSchema);

      // defaultValue 접근을 안전하게 처리
      if (
        hasZodDef(schema) &&
        'defaultValue' in schema._def &&
        typeof schema._def.defaultValue === 'function'
      ) {
        const defaultValue = (schema._def.defaultValue as () => unknown)();

        return {
          ...result,
          default: defaultValue,
        };
      }

      return result;
    }
  }

  if (schema instanceof ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, OpenAPISchema> = {};
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
    const arraySchema = schema as ZodArray<ZodSchema>;
    if (
      arraySchema._def &&
      'type' in arraySchema._def &&
      arraySchema._def.type
    ) {
      return {
        type: 'array',
        items: convertSchema(arraySchema._def.type as unknown as ZodSchema),
      };
    }
    return { type: 'array', items: { type: 'object' } };
  }

  if (schema instanceof ZodString) {
    if (
      hasZodDef(schema) &&
      'checks' in schema._def &&
      Array.isArray(schema._def.checks)
    ) {
      const checks = schema._def.checks as unknown as ZodCheck[];
      const result: OpenAPISchema = { type: 'string' };

      for (const check of checks) {
        if (check.kind === 'email') {
          result.format = 'email';
        } else if (check.kind === 'url') {
          result.format = 'url';
        } else if (check.kind === 'uuid') {
          result.format = 'uuid';
        } else if (check.kind === 'min') {
          result.minLength = check.value as number;
        } else if (check.kind === 'max') {
          result.maxLength = check.value as number;
        } else if (check.kind === 'regex' && check.regex instanceof RegExp) {
          result.pattern = check.regex.source;
        }
      }

      return result;
    }

    return { type: 'string' };
  }

  if (schema instanceof ZodNumber) {
    if (
      hasZodDef(schema) &&
      'checks' in schema._def &&
      Array.isArray(schema._def.checks)
    ) {
      const checks = schema._def.checks as unknown as ZodCheck[];
      const result: OpenAPISchema = { type: 'number' };

      for (const check of checks) {
        if (check.kind === 'min') {
          result.minimum = check.value as number;
        } else if (check.kind === 'max') {
          result.maximum = check.value as number;
        } else if (check.kind === 'int') {
          result.type = 'integer';
        }
      }

      return result;
    }

    return { type: 'number' };
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
      enum: schema.options.map(String),
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
    const nullableSchema = schema as ZodNullable<ZodSchema>;
    if (
      nullableSchema._def &&
      'innerType' in nullableSchema._def &&
      nullableSchema._def.innerType
    ) {
      const innerSchema = convertSchema(
        nullableSchema._def.innerType as unknown as ZodSchema,
      );
      return {
        ...innerSchema,
        nullable: true,
      };
    }
    return { type: 'object', nullable: true };
  }

  if (schema instanceof ZodOptional) {
    const optionalSchema = schema as ZodOptional<ZodSchema>;
    if (
      optionalSchema._def &&
      'innerType' in optionalSchema._def &&
      optionalSchema._def.innerType
    ) {
      return convertSchema(
        optionalSchema._def.innerType as unknown as ZodSchema,
      );
    }
    return { type: 'object' };
  }

  if (schema instanceof ZodUnion) {
    if (
      hasZodDef(schema) &&
      'options' in schema._def &&
      Array.isArray(schema._def.options)
    ) {
      const options = schema._def.options as unknown as ZodSchema[];
      return {
        oneOf: options.map((option: ZodSchema) => convertSchema(option)),
      };
    }

    return { type: 'object' };
  }

  // 기본값
  return { type: 'object' };
}
