import { PostDocument } from '../../models/post.model';
import { UserDocument } from '../../models/user.model';
import { CategoryDocument } from '../../models/category.model';
import { Post } from '../../types/entities/post.types';
import { User } from '../../types/entities/user.types';
import { Category } from '../../types/entities/category.types';
import {
  PostResponse,
  PostWithAuthorResponse,
  PostWithCategoriesResponse,
  PostWithRelationsResponse,
} from '../../types/api/post.response.types';
import { PostMasterSchema } from '../../schemas/master/post.schema';
import {
  PostResponseSchema,
  PostWithAuthorResponseSchema,
  PostWithCategoriesResponseSchema,
  PostWithRelationsResponseSchema,
} from '../../schemas/response/post.response.schema';
import { UserMapper } from './user.mapper';
import { CategoryMapper } from './category.mapper';

/**
 * Post 엔티티 매퍼
 * Mongoose Document와 Entity 간의 타입 안전한 변환 및 populate 로직 담당
 */
export class PostMapper {
  /**
   * Mongoose Document를 Post 엔티티로 변환
   * _id → id 변환 및 타입 검증
   */
  static toEntity(document: PostDocument): Post {
    if (!document) {
      throw new Error('Document is required');
    }

    // toJSON()을 통해 _id → id 변환 및 virtual 필드 포함
    const json = document.toJSON();

    // Zod 스키마로 타입 검증 및 파싱
    return PostMasterSchema.parse({
      ...json,
      // Date 객체 변환
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(json.createdAt),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(json.updatedAt),
      publishedAt: json.publishedAt
        ? json.publishedAt instanceof Date
          ? json.publishedAt
          : new Date(json.publishedAt)
        : undefined,
    });
  }

  /**
   * Post 엔티티를 API 응답용으로 변환
   */
  static toResponse(entity: Post): PostResponse {
    return PostResponseSchema.parse(entity);
  }

  /**
   * Mongoose Document를 직접 API 응답으로 변환
   */
  static documentToResponse(document: PostDocument): PostResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const json = document.toJSON();

    return PostResponseSchema.parse({
      ...json,
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(json.createdAt),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(json.updatedAt),
      publishedAt: json.publishedAt
        ? json.publishedAt instanceof Date
          ? json.publishedAt
          : new Date(json.publishedAt)
        : undefined,
    });
  }

  /**
   * 작성자 정보를 포함한 Post를 응답으로 변환
   */
  static toResponseWithAuthor(
    postDocument: PostDocument,
    authorDocument: UserDocument,
  ): PostWithAuthorResponse {
    if (!postDocument || !authorDocument) {
      throw new Error('Both post and author documents are required');
    }

    const post = this.documentToResponse(postDocument);
    const author = UserMapper.documentToResponse(authorDocument);

    return PostWithAuthorResponseSchema.parse({
      ...post,
      author,
    });
  }

  /**
   * 카테고리 정보를 포함한 Post를 응답으로 변환
   */
  static toResponseWithCategories(
    postDocument: PostDocument,
    categoryDocuments: CategoryDocument[],
  ): PostWithCategoriesResponse {
    if (!postDocument) {
      throw new Error('Post document is required');
    }

    const post = this.documentToResponse(postDocument);
    const categories = categoryDocuments.map((doc) =>
      CategoryMapper.documentToResponse(doc),
    );

    return PostWithCategoriesResponseSchema.parse({
      ...post,
      categories,
    });
  }

  /**
   * 모든 관련 정보를 포함한 Post를 응답으로 변환
   */
  static toResponseWithRelations(
    postDocument: PostDocument,
    authorDocument: UserDocument,
    categoryDocuments: CategoryDocument[],
  ): PostWithRelationsResponse {
    if (!postDocument || !authorDocument) {
      throw new Error('Both post and author documents are required');
    }

    const post = this.documentToResponse(postDocument);
    const author = UserMapper.documentToResponse(authorDocument);
    const categories = categoryDocuments.map((doc) =>
      CategoryMapper.documentToResponse(doc),
    );

    return PostWithRelationsResponseSchema.parse({
      ...post,
      author,
      categories,
    });
  }

  /**
   * Populate된 Document를 응답으로 변환 (동적 populate 처리)
   */
  static populatedDocumentToResponse(
    document: PostDocument & {
      authorId?: UserDocument;
      categoryIds?: CategoryDocument[];
    },
  ): PostResponse | PostWithAuthorResponse | PostWithCategoriesResponse | PostWithRelationsResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const hasAuthor = document.authorId && typeof document.authorId === 'object';
    const hasCategories = 
      document.categoryIds && 
      Array.isArray(document.categoryIds) && 
      document.categoryIds.length > 0 &&
      typeof document.categoryIds[0] === 'object';

    if (hasAuthor && hasCategories) {
      return this.toResponseWithRelations(
        document,
        document.authorId as UserDocument,
        document.categoryIds as CategoryDocument[],
      );
    } else if (hasAuthor) {
      return this.toResponseWithAuthor(
        document,
        document.authorId as UserDocument,
      );
    } else if (hasCategories) {
      return this.toResponseWithCategories(
        document,
        document.categoryIds as CategoryDocument[],
      );
    } else {
      return this.documentToResponse(document);
    }
  }

  /**
   * 여러 Document를 Entity 배열로 변환
   */
  static toEntities(documents: PostDocument[]): Post[] {
    return documents.map((doc) => this.toEntity(doc));
  }

  /**
   * 여러 Document를 응답 배열로 변환
   */
  static documentsToResponses(documents: PostDocument[]): PostResponse[] {
    return documents.map((doc) => this.documentToResponse(doc));
  }

  /**
   * 여러 Populate된 Document를 응답 배열로 변환
   */
  static populatedDocumentsToResponses(
    documents: (PostDocument & {
      authorId?: UserDocument;
      categoryIds?: CategoryDocument[];
    })[],
  ): (PostResponse | PostWithAuthorResponse | PostWithCategoriesResponse | PostWithRelationsResponse)[] {
    return documents.map((doc) => this.populatedDocumentToResponse(doc));
  }
}