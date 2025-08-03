import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostModel, PostSchema } from '../../models/post.model';
import { UserModel, UserSchema } from '../../models/user.model';
import { CategoryModel, CategorySchema } from '../../models/category.model';

/**
 * Posts 모듈
 * 게시물 관련 기능을 제공하는 완전한 모듈
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PostModel.name,
        schema: PostSchema,
      },
      {
        name: UserModel.name,
        schema: UserSchema,
      },
      {
        name: CategoryModel.name,
        schema: CategorySchema,
      },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // 다른 모듈에서 사용할 수 있도록 export
})
export class PostsModule {}
