import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommentModel, CommentDocument } from '../../models/comment.model';
import { UserModel, UserDocument } from '../../models/user.model';
import { PostModel, PostDocument } from '../../models/post.model';
import { CommentMapper } from '../../common/mappers/comment.mapper';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  CommentTreeQueryDto,
} from '../../types/dto/comment.dto.types';
import {
  CommentResponse,
  CommentWithAuthorResponse,
  CommentTreeResponse,
  CommentThreadResponse,
  CommentListResponse,
} from '../../types/api/comment.response.types';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(CommentModel.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PostModel.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  /**
   * 댓글 생성
   */
  async create(
    createCommentDto: CreateCommentDto,
    authorId: string,
  ): Promise<CommentWithAuthorResponse> {
    // 게시물 존재 확인
    const post = await this.postModel.findById(createCommentDto.postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 작성자 존재 확인
    const author = await this.userModel.findById(authorId);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    let parentComment: CommentDocument | null = null;
    let depth = 0;
    let path: string[] = [];

    // 부모 댓글 처리
    if (createCommentDto.parentId) {
      parentComment = await this.commentModel.findById(
        createCommentDto.parentId,
      );

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // 같은 게시물의 댓글인지 확인
      if (parentComment.postId !== createCommentDto.postId) {
        throw new BadRequestException(
          'Parent comment must be from the same post',
        );
      }

      // 최대 깊이 확인
      if (parentComment.depth >= 5) {
        throw new BadRequestException('Maximum comment depth exceeded');
      }

      depth = CommentMapper.calculateDepth(parentComment);
      path = CommentMapper.buildCommentPath(parentComment);
    }

    // 댓글 생성
    const comment = new this.commentModel({
      content: createCommentDto.content,
      authorId,
      postId: createCommentDto.postId,
      parentId: createCommentDto.parentId || null,
      depth,
      path,
      mentionedUserIds: createCommentDto.mentionedUserIds || [],
      metadata: {
        editHistory: [],
      },
    });

    const savedComment = await comment.save();

    // 부모 댓글의 childIds 업데이트
    if (parentComment) {
      await this.commentModel.findByIdAndUpdate(parentComment.id, {
        $push: { childIds: savedComment.id },
      });
    }

    return CommentMapper.toResponseWithAuthor(savedComment, author);
  }

  /**
   * 댓글 목록 조회 (특정 게시물의 댓글들)
   */
  async findByPost(
    postId: string,
    query: CommentQueryDto,
  ): Promise<CommentListResponse> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      includeDeleted = false,
      includeAuthor = false,
      parentId,
    } = query;

    // 필터 조건 구성
    const filter: Record<string, unknown> = { postId };

    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    if (parentId !== undefined) {
      filter.parentId = parentId === 'null' ? null : parentId;
    }

    // 정렬 조건
    const sortField = sortBy as string;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // 페이징 계산
    const skip = (page - 1) * limit;

    // 댓글 조회
    let commentsQuery = this.commentModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (includeAuthor) {
      commentsQuery = commentsQuery.populate('authorId');
    }

    const comments = await commentsQuery.exec();
    const totalCount = await this.commentModel.countDocuments(filter);

    // 응답 생성
    let commentResponses: (CommentResponse | CommentWithAuthorResponse)[];

    if (includeAuthor) {
      commentResponses = comments.map((comment) => {
        const populatedComment = comment as unknown as {
          authorId?: UserDocument;
        };

        if (
          populatedComment.authorId &&
          typeof populatedComment.authorId === 'object'
        ) {
          return CommentMapper.toResponseWithAuthor(
            comment,
            populatedComment.authorId,
          );
        }
        return CommentMapper.documentToResponse(comment);
      }) as (CommentResponse | CommentWithAuthorResponse)[];
    } else {
      commentResponses = CommentMapper.documentsToResponses(comments);
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      comments: commentResponses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    };
  }

  /**
   * 댓글 트리 구조 조회
   */
  async findTreeByPost(
    postId: string,
    query: CommentTreeQueryDto,
  ): Promise<CommentTreeResponse[]> {
    const { includeDeleted = false, includeAuthor = false } = query;

    // 필터 조건
    const filter: Record<string, unknown> = { postId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // 모든 댓글 조회 (depth 순으로 정렬)
    let commentsQuery = this.commentModel
      .find(filter)
      .sort({ depth: 1, createdAt: 1 });

    if (includeAuthor) {
      commentsQuery = commentsQuery.populate('authorId');
    }

    const comments = await commentsQuery.exec();

    if (comments.length === 0) {
      return [];
    }

    // 작성자 매핑 생성 (필요한 경우)
    let authorMap: Map<string, UserDocument> | undefined;

    if (includeAuthor) {
      authorMap = new Map();
      comments.forEach((comment) => {
        const populatedComment = comment as unknown as CommentDocument & {
          authorId?: UserDocument;
        };
        if (
          populatedComment.authorId &&
          typeof populatedComment.authorId === 'object'
        ) {
          authorMap!.set(
            comment.authorId.toString(),
            populatedComment.authorId,
          );
        }
      });
    }

    return CommentMapper.buildCommentTree(comments, authorMap);
  }

  /**
   * 댓글 스레드 구조 조회 (플랫 구조)
   */
  async findThreadByPost(
    postId: string,
    query: CommentTreeQueryDto,
  ): Promise<CommentThreadResponse[]> {
    const { includeDeleted = false, includeAuthor = false } = query;

    // 필터 조건
    const filter: Record<string, unknown> = { postId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // 모든 댓글 조회
    let commentsQuery = this.commentModel.find(filter);

    if (includeAuthor) {
      commentsQuery = commentsQuery.populate('authorId');
    }

    const comments = await commentsQuery.exec();

    if (comments.length === 0) {
      return [];
    }

    // 작성자 매핑 생성 (필요한 경우)
    let authorMap: Map<string, UserDocument> | undefined;

    if (includeAuthor) {
      authorMap = new Map();
      comments.forEach((comment) => {
        const populatedComment = comment as unknown as CommentDocument & {
          authorId?: UserDocument;
        };
        if (
          populatedComment.authorId &&
          typeof populatedComment.authorId === 'object'
        ) {
          authorMap!.set(
            comment.authorId.toString(),
            populatedComment.authorId,
          );
        }
      });
    }

    return CommentMapper.buildCommentThread(comments, authorMap);
  }

  /**
   * 댓글 단일 조회
   */
  async findOne(
    id: string,
    includeAuthor = false,
  ): Promise<CommentResponse | CommentWithAuthorResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    let commentQuery = this.commentModel.findById(id);

    if (includeAuthor) {
      commentQuery = commentQuery.populate('authorId');
    }

    const comment = await commentQuery.exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (includeAuthor) {
      const populatedComment = comment as unknown as {
        authorId?: UserDocument;
      };

      if (
        populatedComment.authorId &&
        typeof populatedComment.authorId === 'object'
      ) {
        return CommentMapper.toResponseWithAuthor(
          comment,
          populatedComment.authorId,
        );
      }
    }

    return CommentMapper.documentToResponse(comment);
  }

  /**
   * 댓글 수정
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentWithAuthorResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // 권한 확인
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // 편집 가능 여부 확인
    if (!CommentMapper.isCommentEditable(comment, userId)) {
      throw new ForbiddenException('Comment is no longer editable');
    }

    // 편집 이력 저장
    const editHistory = comment.metadata?.editHistory || [];
    editHistory.push({
      editedAt: new Date(),
      previousContent: comment.content,
    });

    // 댓글 업데이트
    const updatedComment = await this.commentModel.findByIdAndUpdate(
      id,
      {
        ...updateCommentDto,
        isEdited: true,
        'metadata.editHistory': editHistory,
      },
      { new: true },
    );

    if (!updatedComment) {
      throw new NotFoundException('Comment not found');
    }

    // 작성자 정보 조회
    const author = await this.userModel.findById(updatedComment.authorId);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return CommentMapper.toResponseWithAuthor(updatedComment, author);
  }

  /**
   * 댓글 삭제 (Soft Delete)
   */
  async remove(id: string, userId: string): Promise<CommentResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // 권한 확인
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // 삭제 가능 여부 확인
    if (!CommentMapper.isCommentDeletable(comment, userId)) {
      throw new ForbiddenException('Comment cannot be deleted');
    }

    // Soft Delete 수행
    const deletedComment = await this.commentModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'deleted',
        content: '[삭제된 댓글입니다]',
      },
      { new: true },
    );

    if (!deletedComment) {
      throw new NotFoundException('Comment not found');
    }

    return CommentMapper.documentToResponse(deletedComment);
  }

  /**
   * 댓글 좋아요
   */
  async like(id: string): Promise<CommentResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const comment = await this.commentModel.findByIdAndUpdate(
      id,
      { $inc: { likeCount: 1 } },
      { new: true },
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return CommentMapper.documentToResponse(comment);
  }

  /**
   * 댓글 신고
   */
  async report(id: string): Promise<CommentResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const comment = await this.commentModel.findByIdAndUpdate(
      id,
      { $inc: { reportCount: 1 } },
      { new: true },
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return CommentMapper.documentToResponse(comment);
  }

  /**
   * 사용자의 댓글 목록 조회
   */
  async findByAuthor(
    authorId: string,
    query: CommentQueryDto,
  ): Promise<CommentListResponse> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = query;

    // 필터 조건
    const filter: Record<string, unknown> = { authorId };
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // 정렬 조건
    const sortField = sortBy as string;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // 페이징 계산
    const skip = (page - 1) * limit;

    // 댓글 조회 (게시물 정보 포함)
    const comments = await this.commentModel
      .find(filter)
      .populate('postId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    const totalCount = await this.commentModel.countDocuments(filter);

    const commentResponses = CommentMapper.documentsToResponses(comments);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      comments: commentResponses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    };
  }
}
