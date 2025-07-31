import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * 데이터베이스 모듈
 * MongoDB 연결 설정 및 전역 설정 관리
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI ||
          'mongodb://localhost:27017/zod-architecture',
        // 전역 Mongoose 설정
        connectionFactory: (
          connection: typeof import('mongoose').connection,
        ) => {
          // __v 필드 비활성화 (전역 설정)
          (connection as { set(key: string, value: unknown): void }).set(
            'versionKey',
            false,
          );

          // 디버그 모드 (개발 환경에서만)
          if (process.env.NODE_ENV === 'development') {
            (connection as { set(key: string, value: unknown): void }).set(
              'debug',
              true,
            );
          }

          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
