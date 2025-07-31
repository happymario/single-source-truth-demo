import { UserDocument } from '../../models/user.model';
import { User } from '../../types/entities/user.types';
import { UserResponse } from '../../types/api/user.response.types';
import { UserMasterSchema } from '../../schemas/master/user.schema';
import { UserResponseSchema } from '../../schemas/response/user.response.schema';

/**
 * User 엔티티 매퍼
 * Mongoose Document와 Entity 간의 타입 안전한 변환 담당
 */
export class UserMapper {
  /**
   * Mongoose Document를 User 엔티티로 변환
   * _id → id 변환 및 타입 검증
   */
  static toEntity(document: UserDocument): User {
    if (!document) {
      throw new Error('Document is required');
    }

    // toJSON()을 통해 _id → id 변환 및 virtual 필드 포함
    const json = document.toJSON();

    // Zod 스키마로 타입 검증 및 파싱
    return UserMasterSchema.parse({
      ...json,
      // Date 객체 변환 (MongoDB에서 가져온 데이터는 Date 객체여야 함)
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(json.createdAt),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(json.updatedAt),
      lastLoginAt: json.lastLoginAt
        ? json.lastLoginAt instanceof Date
          ? json.lastLoginAt
          : new Date(json.lastLoginAt)
        : undefined,
    });
  }

  /**
   * User 엔티티를 API 응답용으로 변환 (비밀번호 제외)
   */
  static toResponse(entity: User): UserResponse {
    // 비밀번호 제외하고 응답 스키마로 검증
    return UserResponseSchema.parse(entity);
  }

  /**
   * Mongoose Document를 직접 API 응답으로 변환
   * (Entity 변환을 거치지 않는 최적화된 방법)
   */
  static documentToResponse(document: UserDocument): UserResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const json = document.toJSON();

    return UserResponseSchema.parse({
      ...json,
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(json.createdAt),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(json.updatedAt),
      lastLoginAt: json.lastLoginAt
        ? json.lastLoginAt instanceof Date
          ? json.lastLoginAt
          : new Date(json.lastLoginAt)
        : undefined,
    });
  }

  /**
   * 여러 Document를 Entity 배열로 변환
   */
  static toEntities(documents: UserDocument[]): User[] {
    return documents.map((doc) => this.toEntity(doc));
  }

  /**
   * 여러 Document를 응답 배열로 변환
   */
  static documentsToResponses(documents: UserDocument[]): UserResponse[] {
    return documents.map((doc) => this.documentToResponse(doc));
  }
}
