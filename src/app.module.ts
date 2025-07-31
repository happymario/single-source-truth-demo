import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [
    // 공통 모듈 (전역 필터, 파이프 등)
    CommonModule,
    // 데이터베이스 모듈 (MongoDB 연결)
    DatabaseModule,
    // 기능 모듈들
    UsersModule,
    CategoriesModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
