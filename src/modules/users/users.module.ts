import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserModel, UserSchema } from '../../models/user.model';

/**
 * 사용자 모듈
 * User 관련 모든 기능을 캡슐화
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 다른 모듈에서 사용할 수 있도록 export
})
export class UsersModule {}
