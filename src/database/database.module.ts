import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 데이터베이스 모듈
 * MongoDB 연결 설정 및 전역 설정 관리
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
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
          if (configService.get<string>('NODE_ENV') === 'development') {
            (connection as { set(key: string, value: unknown): void }).set(
              'debug',
              true,
            );
          }

          console.log(
            `MongoDB connected to: ${configService.get<string>('MONGODB_URI')}`,
          );

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
