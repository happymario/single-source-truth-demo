import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryModel, CategorySchema } from '../../models/category.model';

/**
 * 카테고리 모듈
 * 카테고리 관련 기능 제공
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryModel.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
