import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';

/**
 * 모든 Mongoose 모델의 기본 클래스
 * MongoDB의 _id를 id로 자동 변환하고 타임스탬프를 관리
 */
@Schema()
export abstract class BaseModel {
  /**
   * MongoDB ObjectId
   * 실제 DB에는 _id로 저장되지만 virtual을 통해 id로 접근 가능
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Types.ObjectId;

  /**
   * Virtual field: _id를 문자열 id로 변환
   */
  get id(): string {
    return this._id.toHexString();
  }

  /**
   * 생성 일시
   */
  @Prop({ default: Date.now })
  createdAt: Date;

  /**
   * 수정 일시
   */
  @Prop({ default: Date.now })
  updatedAt: Date;
}

/**
 * Mongoose 스키마 기본 옵션
 */
export const SCHEMA_OPTIONS = {
  versionKey: false,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc: mongoose.Document, ret: Record<string, unknown>) => {
      // _id를 id로 변환
      if (ret._id && typeof ret._id === 'object' && 'toHexString' in ret._id) {
        ret.id = (ret._id as { toHexString(): string }).toHexString();
        delete ret._id;
      }
      // __v 제거 (혹시 있을 경우를 대비)
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc: mongoose.Document, ret: Record<string, unknown>) => {
      // _id를 id로 변환
      if (ret._id && typeof ret._id === 'object' && 'toHexString' in ret._id) {
        ret.id = (ret._id as { toHexString(): string }).toHexString();
        delete ret._id;
      }
      // __v 제거
      delete ret.__v;
      return ret;
    },
  },
};
