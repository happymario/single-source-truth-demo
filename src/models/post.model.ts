import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseModel, SCHEMA_OPTIONS } from './base.model';
import { Post } from '../types/entities/post.types';

/**
 * Post MongoDB Document 타입
 */
export type PostDocument = HydratedDocument<PostModel>;

/**
 * Post Mongoose 모델
 * Post 타입을 정확히 구현하며 BaseModel을 상속
 */
@Schema({
  collection: 'posts',
  ...SCHEMA_OPTIONS,
})
export class PostModel extends BaseModel implements Post {
  /**
   * 게시물 제목
   */
  @Prop({
    required: true,
    trim: true,
    index: 'text',
  })
  title: string;

  /**
   * 게시물 슬러그 (URL 친화적 식별자)
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  /**
   * 게시물 내용
   */
  @Prop({
    required: true,
    index: 'text',
  })
  content: string;

  /**
   * 게시물 요약 (선택사항)
   */
  @Prop({
    required: false,
    trim: true,
  })
  excerpt?: string;

  /**
   * 작성자 ID (User 참조)
   */
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'UserModel',
    index: true,
  })
  authorId: string;

  /**
   * 카테고리 ID 배열 (Category 참조)
   */
  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: 'CategoryModel' }],
    default: [],
    index: true,
  })
  categoryIds: string[];

  /**
   * 태그 배열
   */
  @Prop({
    required: true,
    type: [String],
    default: [],
    index: true,
  })
  tags: string[];

  /**
   * 게시물 상태
   */
  @Prop({
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  /**
   * 공개 여부
   */
  @Prop({
    required: true,
    default: true,
    index: true,
  })
  isPublic: boolean;

  /**
   * 댓글 허용 여부
   */
  @Prop({
    required: true,
    default: true,
  })
  allowComments: boolean;

  /**
   * 추천 표시 여부
   */
  @Prop({
    required: true,
    default: false,
    index: true,
  })
  isFeatured: boolean;

  /**
   * 조회수
   */
  @Prop({
    required: true,
    default: 0,
    min: 0,
    index: true,
  })
  viewCount: number;

  /**
   * 좋아요 수
   */
  @Prop({
    required: true,
    default: 0,
    min: 0,
    index: true,
  })
  likeCount: number;

  /**
   * 댓글 수
   */
  @Prop({
    required: true,
    default: 0,
    min: 0,
    index: true,
  })
  commentCount: number;

  /**
   * 썸네일 이미지 URL (선택사항)
   */
  @Prop({
    required: false,
  })
  thumbnail?: string;

  /**
   * SEO 메타 제목
   */
  @Prop({
    required: false,
    trim: true,
  })
  metaTitle?: string;

  /**
   * SEO 메타 설명
   */
  @Prop({
    required: false,
    trim: true,
  })
  metaDescription?: string;

  /**
   * 게시 예정 시간 (선택사항)
   */
  @Prop({
    required: false,
    index: true,
  })
  publishedAt?: Date;
}

/**
 * Post Mongoose Schema
 */
export const PostSchema = SchemaFactory.createForClass(PostModel);

// 복합 인덱스 설정
PostSchema.index({ authorId: 1, status: 1 });
PostSchema.index({ status: 1, isPublic: 1, publishedAt: -1 });
PostSchema.index({ categoryIds: 1, status: 1 });
PostSchema.index({ tags: 1, status: 1 });
PostSchema.index({ isFeatured: 1, status: 1, publishedAt: -1 });
PostSchema.index({ viewCount: -1, status: 1 });
PostSchema.index({ likeCount: -1, status: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ publishedAt: -1 });

// 텍스트 검색 인덱스
PostSchema.index(
  {
    title: 'text',
    content: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 10,
      tags: 5,
      content: 1,
    },
    name: 'post_text_index',
  },
);

// 슬러그 유니크 인덱스
PostSchema.index({ slug: 1 }, { unique: true });
