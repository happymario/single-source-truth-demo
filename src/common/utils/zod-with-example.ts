import { z } from 'zod';

/**
 * Zod 스키마에 example 메타데이터를 추가합니다.
 *
 * @param schema - Zod 스키마
 * @param example - 예제 데이터 (스키마 타입과 일치해야 함)
 * @returns example이 추가된 스키마
 *
 * @example
 * ```typescript
 * const UserSchema = withExample(
 *   z.object({ name: z.string(), age: z.number() }),
 *   { name: '홍길동', age: 30 }
 * );
 * ```
 */
export function withExample<T extends z.ZodTypeAny>(
  schema: T,
  example: z.infer<T>,
): T & { _example?: z.infer<T> } {
  return Object.assign(schema, { _example: example });
}
