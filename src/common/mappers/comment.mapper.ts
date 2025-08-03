import { CommentDocument } from '../../models/comment.model';
import { UserDocument } from '../../models/user.model';
import { PostDocument } from '../../models/post.model';
import { Comment } from '../../types/entities/comment.types';
import {
  CommentResponse,
  CommentWithAuthorResponse,
  CommentWithRepliesResponse,
} from '../../types/api/comment.response.types';
import { CommentMasterSchema } from '../../schemas/master/comment.schema';
import {
  CommentResponseSchema,
  CommentWithAuthorResponseSchema,
  CommentWithRepliesResponseSchema,
} from '../../schemas/response/comment.response.schema';
import { UserMapper } from './user.mapper';

/**
 * Comment 엔티티 매퍼
 * Mongoose Document와 Entity 간의 타입 안전한 변환 및 트리 구조 처리 담당
 */
export class CommentMapper {
  /**
   * Mongoose Document를 Comment 엔티티로 변환
   * _id → id 변환 및 타입 검증
   */
  static toEntity(document: CommentDocument): Comment {
    if (!document) {
      throw new Error('Document is required');
    }

    // toJSON()을 통해 _id → id 변환 및 virtual 필드 포함
    const json = document.toJSON();

    // Zod 스키마로 타입 검증 및 파싱
    return CommentMasterSchema.parse({
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
      deletedAt: json.deletedAt
        ? json.deletedAt instanceof Date
          ? json.deletedAt
          : new Date(json.deletedAt)
        : undefined,
    });
  }

  /**
   * Comment 엔티티를 API 응답용으로 변환
   */
  static toResponse(entity: Comment): CommentResponse {
    return CommentResponseSchema.parse(entity);
  }

  /**
   * Mongoose Document를 직접 API 응답으로 변환
   */
  static documentToResponse(document: CommentDocument): CommentResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const json = document.toJSON();

    return CommentResponseSchema.parse({
      ...json,
      createdAt:
        json.createdAt instanceof Date
          ? json.createdAt
          : new Date(json.createdAt),
      updatedAt:
        json.updatedAt instanceof Date
          ? json.updatedAt
          : new Date(json.updatedAt),
      deletedAt: json.deletedAt
        ? json.deletedAt instanceof Date
          ? json.deletedAt
          : new Date(json.deletedAt)
        : undefined,
    });
  }

  /**
   * 작성자 정보를 포함한 Comment를 응답으로 변환
   */
  static toResponseWithAuthor(
    commentDocument: CommentDocument,
    authorDocument: UserDocument,
  ): CommentWithAuthorResponse {
    if (!commentDocument || !authorDocument) {
      throw new Error('Both comment and author documents are required');
    }

    const comment = this.documentToResponse(commentDocument);
    const author = UserMapper.documentToResponse(authorDocument);

    return CommentWithAuthorResponseSchema.parse({
      ...comment,
      author,
    });
  }

  /**
   * 답글을 포함한 Comment를 응답으로 변환
   */
  static toResponseWithReplies(
    commentDocument: CommentDocument,
    replyDocuments: CommentDocument[],
    authorDocuments?: UserDocument[],
  ): CommentWithRepliesResponse {
    if (!commentDocument) {
      throw new Error('Comment document is required');
    }

    const comment = this.documentToResponse(commentDocument);

    let replies: CommentResponse[] | CommentWithAuthorResponse[];

    if (authorDocuments && authorDocuments.length > 0) {
      // 작성자 정보가 있는 경우
      replies = replyDocuments.map((replyDoc, index) => {
        const authorDoc = authorDocuments[index];
        if (authorDoc) {
          return this.toResponseWithAuthor(replyDoc, authorDoc);
        }
        return this.documentToResponse(replyDoc);
      });
    } else {
      // 작성자 정보가 없는 경우
      replies = replyDocuments.map((replyDoc) =>
        this.documentToResponse(replyDoc),
      );
    }

    return CommentWithRepliesResponseSchema.parse({
      ...comment,
      replies,
    });
  }

  /**
   * Populate된 Document를 응답으로 변환 (동적 populate 처리)
   */
  static populatedDocumentToResponse(
    document: CommentDocument & {
      authorId?: UserDocument;
      postId?: PostDocument;
      parentId?: CommentDocument;
      childIds?: CommentDocument[];
    },
  ): CommentResponse | CommentWithAuthorResponse | CommentWithRepliesResponse {
    if (!document) {
      throw new Error('Document is required');
    }

    const hasAuthor =
      document.authorId && typeof document.authorId === 'object';
    const hasReplies =
      document.childIds &&
      Array.isArray(document.childIds) &&
      document.childIds.length > 0 &&
      typeof document.childIds[0] === 'object';

    if (hasAuthor && hasReplies) {
      return this.toResponseWithReplies(
        document,
        document.childIds as CommentDocument[],
        [document.authorId as UserDocument], // 부모 댓글 작성자만 포함
      );
    } else if (hasAuthor) {
      return this.toResponseWithAuthor(
        document,
        document.authorId as UserDocument,
      );
    } else if (hasReplies) {
      return this.toResponseWithReplies(
        document,
        document.childIds as CommentDocument[],
      );
    } else {
      return this.documentToResponse(document);
    }
  }

  /**
   * 여러 Document를 Entity 배열로 변환
   */
  static toEntities(documents: CommentDocument[]): Comment[] {
    return documents.map((doc) => this.toEntity(doc));
  }

  /**
   * 여러 Document를 응답 배열로 변환
   */
  static documentsToResponses(documents: CommentDocument[]): CommentResponse[] {
    return documents.map((doc) => this.documentToResponse(doc));
  }

  /**
   * 여러 Populate된 Document를 응답 배열로 변환
   */
  static populatedDocumentsToResponses(
    documents: (CommentDocument & {
      authorId?: UserDocument;
      postId?: PostDocument;
      parentId?: CommentDocument;
      childIds?: CommentDocument[];
    })[],
  ): (
    | CommentResponse
    | CommentWithAuthorResponse
    | CommentWithRepliesResponse
  )[] {
    return documents.map((doc) => this.populatedDocumentToResponse(doc));
  }
}
