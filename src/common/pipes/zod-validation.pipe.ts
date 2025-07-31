import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Zod 스키마를 사용한 검증 파이프
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      // Zod 스키마로 검증 및 파싱
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod 에러를 BadRequestException으로 변환
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      throw error;
    }
  }
}

/**
 * 전역 Zod 검증 파이프 (스키마 없이 사용)
 * 주로 데코레이터와 함께 사용
 */
@Injectable()
export class GlobalZodValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 메타데이터에 스키마가 있는 경우 검증
    const schema = (metadata as any).schema as ZodSchema | undefined;
    
    if (!schema) {
      // 스키마가 없으면 그대로 통과
      return value;
    }

    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      throw error;
    }
  }
}