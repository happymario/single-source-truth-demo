import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/zod-exception.filter';

/**
 * 공통 모듈
 * 전역적으로 사용되는 파이프, 필터, 가드 등을 제공
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [],
})
export class CommonModule {}
