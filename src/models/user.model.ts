import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel, SCHEMA_OPTIONS } from './base.model';
import { User } from '../types/entities/user.types';

/**
 * User MongoDB Document 타입
 */
export type UserDocument = HydratedDocument<UserModel>;

/**
 * User Mongoose 모델
 * User 타입을 정확히 구현하며 BaseModel을 상속
 */
@Schema({
  collection: 'zod_users',
  ...SCHEMA_OPTIONS,
})
export class UserModel extends BaseModel implements User {
  /**
   * 이메일 주소 (고유값)
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  /**
   * 비밀번호 (해시된 값)
   */
  @Prop({
    required: true,
    select: false, // 기본적으로 조회 시 제외
  })
  password: string;

  /**
   * 사용자 이름
   */
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  /**
   * 자기소개 (선택)
   */
  @Prop({
    required: false,
    trim: true,
  })
  bio?: string;

  /**
   * 프로필 이미지 URL (선택)
   */
  @Prop({
    required: false,
  })
  avatar?: string;

  /**
   * 사용자 권한
   */
  @Prop({
    required: true,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  })
  role: 'user' | 'admin';

  /**
   * 계정 활성화 상태
   */
  @Prop({
    required: true,
    default: true,
    index: true,
  })
  isActive: boolean;

  /**
   * 마지막 로그인 시간 (선택)
   */
  @Prop({
    required: false,
  })
  lastLoginAt?: Date;
}

/**
 * User Mongoose Schema
 */
export const UserSchema = SchemaFactory.createForClass(UserModel);

// 인덱스 설정
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// 가상 필드나 메서드가 필요한 경우 여기에 추가
// UserSchema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });
