import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { BaseModel, SCHEMA_OPTIONS } from './base.model';
import type { Category } from '../types/entities/category.types';

/**
 * Category Mongoose 모델
 * BaseModel을 상속하여 _id ↔ id 자동 변환
 * Zod Category 타입을 정확히 구현
 */
@Schema({
  collection: 'categories',
  ...SCHEMA_OPTIONS,
})
export class CategoryModel extends BaseModel implements Category {
  /**
   * 카테고리 이름
   */
  @Prop({ required: true, maxlength: 50 })
  name: string;

  /**
   * 카테고리 슬러그 (고유값)
   */
  @Prop({ required: true, unique: true, maxlength: 100 })
  slug: string;

  /**
   * 카테고리 설명 (선택사항)
   */
  @Prop({ maxlength: 500 })
  description?: string;

  /**
   * 카테고리 색상 (HEX 색상 코드)
   */
  @Prop({ required: true, match: /^#[0-9a-fA-F]{6}$/ })
  color: string;

  /**
   * 카테고리 아이콘 (선택사항)
   */
  @Prop({ maxlength: 10 })
  icon?: string;

  /**
   * 부모 카테고리 ID (계층 구조 지원)
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryModel',
    default: null,
  })
  parentId?: string;

  /**
   * 카테고리 순서 (정렬용)
   */
  @Prop({ min: 0, max: 9999, default: 0 })
  order: number;

  /**
   * 활성 상태
   */
  @Prop({ default: true })
  isActive: boolean;
}

/**
 * Category Document 타입
 */
export type CategoryDocument = CategoryModel & Document;

/**
 * Category Mongoose 스키마
 */
export const CategorySchema = SchemaFactory.createForClass(CategoryModel);

/**
 * 스키마 레벨 인덱스
 */
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ order: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ name: 'text' }); // 텍스트 검색용
