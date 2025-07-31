import { CommentDocument } from '../../models/comment.model';
import { UserDocument } from '../../models/user.model';
import { PostDocument } from '../../models/post.model';
import { Comment } from '../../types/entities/comment.types';
import {
  CommentResponse,
  CommentWithAuthorResponse,
  CommentWithRepliesResponse,
  CommentTreeResponse,
  CommentThreadResponse,
} from '../../types/api/comment.response.types';
import { CommentMasterSchema } from '../../schemas/master/comment.schema';
import {
  CommentResponseSchema,
  CommentWithAuthorResponseSchema,
  CommentWithRepliesResponseSchema,
  CommentTreeResponseSchema,
  CommentThreadResponseSchema,
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
   * 댓글 트리 구조를 생성하여 응답으로 변환
   */
  static buildCommentTree(
    comments: CommentDocument[],
    authorMap?: Map<string, UserDocument>,
  ): CommentTreeResponse[] {
    if (!comments || comments.length === 0) {
      return [];
    }

    // 댓글을 ID로 매핑
    const commentMap = new Map<string, CommentDocument>();
    comments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    // 트리 구조 생성
    const tree: CommentTreeResponse[] = [];
    const processed = new Set<string>();

    // 루트 댓글부터 처리 (parentId가 null인 댓글)
    const rootComments = comments.filter((comment) => !comment.parentId);

    rootComments.forEach((rootComment) => {
      if (!processed.has(rootComment.id)) {
        const treeNode = this.buildCommentTreeNode(
          rootComment,
          commentMap,
          authorMap,
          processed,
        );
        if (treeNode) {
          tree.push(treeNode);
        }
      }
    });

    return tree;
  }

  /**
   * 단일 댓글 트리 노드 생성 (재귀)
   */
  private static buildCommentTreeNode(
    comment: CommentDocument,
    commentMap: Map<string, CommentDocument>,
    authorMap?: Map<string, UserDocument>,
    processed: Set<string> = new Set(),
  ): CommentTreeResponse | null {
    if (processed.has(comment.id)) {
      return null;
    }

    processed.add(comment.id);

    // 기본 댓글 응답 생성
    let commentResponse: CommentResponse | CommentWithAuthorResponse;

    if (authorMap && authorMap.has(comment.authorId)) {
      commentResponse = this.toResponseWithAuthor(
        comment,
        authorMap.get(comment.authorId)!,
      );
    } else {
      commentResponse = this.documentToResponse(comment);
    }

    // 자식 댓글 처리
    const children: CommentTreeResponse[] = [];

    if (comment.childIds && comment.childIds.length > 0) {
      comment.childIds.forEach((childId: string) => {
        const childComment = commentMap.get(childId);
        if (childComment && !processed.has(childId)) {
          const childNode = this.buildCommentTreeNode(
            childComment,
            commentMap,
            authorMap,
            processed,
          );
          if (childNode) {
            children.push(childNode);
          }
        }
      });
    }

    return CommentTreeResponseSchema.parse({
      ...commentResponse,
      children,
      childCount: children.length,
      isRoot: !comment.parentId,
    });
  }

  /**
   * 댓글 스레드 구조를 생성하여 응답으로 변환 (플랫 구조)
   */
  static buildCommentThread(
    comments: CommentDocument[],
    authorMap?: Map<string, UserDocument>,
  ): CommentThreadResponse[] {
    if (!comments || comments.length === 0) {
      return [];
    }

    // depth 순으로 정렬
    const sortedComments = [...comments].sort((a, b) => {
      // 먼저 depth로 정렬
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      // 같은 depth면 생성일시로 정렬
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return sortedComments.map((comment) => {
      let commentResponse: CommentResponse | CommentWithAuthorResponse;

      if (authorMap && authorMap.has(comment.authorId)) {
        commentResponse = this.toResponseWithAuthor(
          comment,
          authorMap.get(comment.authorId)!,
        );
      } else {
        commentResponse = this.documentToResponse(comment);
      }

      return CommentThreadResponseSchema.parse({
        ...commentResponse,
        depth: comment.depth,
        parentId: comment.parentId || null,
        isRoot: !comment.parentId,
        hasChildren: comment.childIds.length > 0,
      });
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

  /**
   * 댓글 경로 생성 (부모 댓글들의 ID 배열)
   */
  static buildCommentPath(parentComment: CommentDocument | null): string[] {
    if (!parentComment) {
      return [];
    }

    const path = Array.isArray(parentComment.path) ? parentComment.path : [];
    return path.concat(parentComment.id);
  }

  /**
   * 댓글 깊이 계산
   */
  static calculateDepth(parentComment: CommentDocument | null): number {
    if (!parentComment) {
      return 0;
    }

    return Math.min(parentComment.depth + 1, 5); // 최대 깊이 5로 제한
  }

  /**
   * 댓글이 수정 가능한지 확인
   */
  static isCommentEditable(
    comment: CommentDocument,
    userId: string,
    timeLimit: number = 24 * 60 * 60 * 1000, // 24시간
  ): boolean {
    // 본인 댓글이 아닌 경우
    if (comment.authorId !== userId) {
      return false;
    }

    // 이미 삭제된 댓글인 경우
    if (comment.isDeleted) {
      return false;
    }

    // 시간 제한 확인
    const now = new Date();
    const timeDiff = now.getTime() - comment.createdAt.getTime();

    return timeDiff <= timeLimit;
  }

  /**
   * 댓글이 삭제 가능한지 확인
   */
  static isCommentDeletable(comment: CommentDocument, userId: string): boolean {
    // 본인 댓글이 아닌 경우
    if (comment.authorId !== userId) {
      return false;
    }

    // 이미 삭제된 댓글인 경우
    if (comment.isDeleted) {
      return false;
    }

    // 자식 댓글이 있는 경우 soft delete만 가능
    return true;
  }
}
