import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseModel, SCHEMA_OPTIONS } from './base.model';
import { Comment } from '../types/entities/comment.types';

/**
 * Comment MongoDB Document 타입
 */
export type CommentDocument = HydratedDocument<CommentModel>;

/**
 * Comment Mongoose 모델
 * Comment 타입을 정확히 구현하며 BaseModel을 상속
 */
@Schema({
  collection: 'comments',
  ...SCHEMA_OPTIONS,
})
export class CommentModel extends BaseModel implements Comment {
  /**
   * 댓글 내용
   */
  @Prop({
    required: true,
    trim: true,
    index: 'text',
  })
  content: string;

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
   * 게시물 ID (Post 참조)
   */
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'PostModel',
    index: true,
  })
  postId: string;

  /**
   * 부모 댓글 ID (자기 참조)
   */
  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'CommentModel',
    default: null,
    index: true,
  })
  parentId?: string | null;

  /**
   * 댓글 깊이
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    index: true,
  })
  depth: number;

  /**
   * 자식 댓글 ID 배열
   */
  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: 'CommentModel' }],
    default: [],
    index: true,
  })
  childIds: string[];

  /**
   * 댓글 경로 (계층 구조 탐색용)
   */
  @Prop({
    required: true,
    type: [{ type: Types.ObjectId }],
    default: [],
    index: true,
  })
  path: string[];

  /**
   * 댓글 상태
   */
  @Prop({
    required: true,
    enum: ['active', 'edited', 'deleted'],
    default: 'active',
    index: true,
  })
  status: 'active' | 'edited' | 'deleted';

  /**
   * 좋아요 수
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
    index: true,
  })
  likeCount: number;

  /**
   * 신고 횟수
   */
  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
    index: true,
  })
  reportCount: number;

  /**
   * 수정 여부
   */
  @Prop({
    required: true,
    type: Boolean,
    default: false,
  })
  isEdited: boolean;

  /**
   * 삭제 여부 (soft delete)
   */
  @Prop({
    required: true,
    type: Boolean,
    default: false,
    index: true,
  })
  isDeleted: boolean;

  /**
   * 삭제 일시
   */
  @Prop({
    required: false,
    type: Date,
    default: null,
  })
  deletedAt?: Date | null;

  /**
   * 멘션된 사용자 ID 배열
   */
  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: 'UserModel' }],
    default: [],
    index: true,
  })
  mentionedUserIds: string[];

  /**
   * 댓글 메타데이터
   */
  @Prop({
    required: false,
    type: {
      ipHash: { type: String, required: false },
      userAgent: { type: String, required: false },
      editHistory: [
        {
          editedAt: { type: Date, required: true },
          previousContent: { type: String, required: true },
        },
      ],
    },
  })
  metadata?: {
    ipHash?: string;
    userAgent?: string;
    editHistory: {
      editedAt: Date;
      previousContent: string;
    }[];
  };
}

/**
 * Comment Mongoose Schema
 */
export const CommentSchema = SchemaFactory.createForClass(CommentModel);

// 복합 인덱스 설정
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 });
CommentSchema.index({ postId: 1, depth: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, status: 1, isDeleted: 1 });
CommentSchema.index({ parentId: 1, status: 1, isDeleted: 1 });
CommentSchema.index({ mentionedUserIds: 1, createdAt: -1 });
CommentSchema.index({ likeCount: -1, status: 1 });
CommentSchema.index({ reportCount: -1, status: 1 });

// 트리 구조 쿼리를 위한 특별한 인덱스
CommentSchema.index({ postId: 1, path: 1, depth: 1 });

// 텍스트 검색 인덱스
CommentSchema.index(
  {
    content: 'text',
  },
  {
    name: 'comment_text_index',
  },
);

// 가상 필드: 자식 댓글 수
CommentSchema.virtual('childCount').get(function () {
  return this.childIds ? this.childIds.length : 0;
});

// 가상 필드: 루트 댓글인지 확인
CommentSchema.virtual('isRoot').get(function () {
  return !this.parentId;
});

// 가상 필드: 삭제 가능한지 확인 (자식이 없고 본인 댓글인 경우)
CommentSchema.virtual('isDeletable').get(function () {
  return this.childIds.length === 0 && !this.isDeleted;
});

// 스키마 미들웨어: 댓글 삭제 시 자동으로 상태 업데이트
CommentSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as any;
  if (update.isDeleted === true) {
    update.deletedAt = new Date();
    update.status = 'deleted';
  }
});

// 스키마 미들웨어: 댓글 수정 시 자동으로 편집 이력 추가
CommentSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as any;
  if (update.content && !update.isDeleted) {
    update.isEdited = true;
    // 편집 이력은 서비스 레벨에서 처리
  }
});