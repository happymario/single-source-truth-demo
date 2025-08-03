import { CategoryMasterSchema } from '../../schemas/master/category.schema';
import type { Category } from '../../types/entities/category.types';
import type { CategoryResponse } from '../../types/api/category.response.types';
import type { CategoryDocument } from '../../models/category.model';

/**
 * Category 매퍼 클래스
 * Document ↔ Entity ↔ Response 간 타입 안전한 변환 처리
 */
export class CategoryMapper {
  /**
   * CategoryDocument를 Category 엔티티로 변환
   * Zod 스키마를 사용한 타입 검증 포함
   */
  static toEntity(document: CategoryDocument): Category {
    if (!document) {
      throw new Error('Document is required');
    }

    const json = document.toJSON();

    // Zod 스키마로 타입 검증 및 파싱
    return CategoryMasterSchema.parse({
      ...json,
      // Date 객체 변환 (MongoDB에서 가져온 데이터는 Date 객체여야 함)
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(String(json.createdAt)),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(String(json.updatedAt)),
    });
  }

  /**
   * Category 엔티티를 CategoryResponse로 변환
   * 모든 필드 포함 (카테고리에는 민감한 정보 없음)
   */
  static toResponse(entity: Category): CategoryResponse {
    return {
      ...entity,
    };
  }

  /**
   * CategoryDocument를 CategoryResponse로 직접 변환
   * Document → Entity → Response 체인
   */
  static documentToResponse(document: CategoryDocument): CategoryResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const entity = this.toEntity(document);
    return this.toResponse(entity);
  }

  /**
   * CategoryDocument 배열을 Category 엔티티 배열로 변환
   */
  static toEntities(documents: CategoryDocument[]): Category[] {
    return documents.map((doc) => this.toEntity(doc));
  }

  /**
   * CategoryDocument 배열을 CategoryResponse 배열로 변환
   */
  static documentsToResponses(
    documents: CategoryDocument[],
  ): CategoryResponse[] {
    return documents.map((doc) => this.documentToResponse(doc));
  }

  /**
   * Category 엔티티 배열을 CategoryResponse 배열로 변환
   */
  static entitiesToResponses(entities: Category[]): CategoryResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
