import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentModel, CommentSchema } from '../../models/comment.model';
import { UserModel, UserSchema } from '../../models/user.model';
import { PostModel, PostSchema } from '../../models/post.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommentModel.name, schema: CommentSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: PostModel.name, schema: PostSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
