import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    // 환경 변수 설정 (최상위에 위치해야 함)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 공통 모듈 (전역 필터, 파이프 등)
    CommonModule,
    // 데이터베이스 모듈 (MongoDB 연결)
    DatabaseModule,
    // 기능 모듈들
    UsersModule,
    CategoriesModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
