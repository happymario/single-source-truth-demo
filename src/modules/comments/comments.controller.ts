import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentQuerySchema,
  CommentTreeQuerySchema,
} from '../../schemas/dto/comment.dto.schema';
import {
  CommentResponse,
  CommentWithAuthorResponse,
  CommentTreeResponse,
  CommentThreadResponse,
  CommentListResponse,
} from '../../types/api/comment.response.types';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 댓글 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCommentDto: unknown,
  ): Promise<CommentWithAuthorResponse> {
    const validatedDto = CreateCommentSchema.parse(createCommentDto);

    // TODO: 실제 구현에서는 JWT에서 사용자 ID를 추출해야 함
    const authorId = '507f1f77bcf86cd799439011'; // 임시 하드코딩

    return this.commentsService.create(validatedDto, authorId);
  }

  /**
   * 특정 게시물의 댓글 목록 조회
   */
  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query() query: unknown,
  ): Promise<CommentListResponse> {
    const validatedQuery = CommentQuerySchema.parse(query);
    return this.commentsService.findByPost(postId, validatedQuery);
  }

  /**
   * 특정 게시물의 댓글 트리 구조 조회
   */
  @Get('post/:postId/tree')
  async findTreeByPost(
    @Param('postId') postId: string,
    @Query() query: unknown,
  ): Promise<CommentTreeResponse[]> {
    const validatedQuery = CommentTreeQuerySchema.parse(query);
    return this.commentsService.findTreeByPost(postId, validatedQuery);
  }

  /**
   * 특정 게시물의 댓글 스레드 구조 조회
   */
  @Get('post/:postId/thread')
  async findThreadByPost(
    @Param('postId') postId: string,
    @Query() query: unknown,
  ): Promise<CommentThreadResponse[]> {
    const validatedQuery = CommentTreeQuerySchema.parse(query);
    return this.commentsService.findThreadByPost(postId, validatedQuery);
  }

  /**
   * 특정 사용자의 댓글 목록 조회
   */
  @Get('author/:authorId')
  async findByAuthor(
    @Param('authorId') authorId: string,
    @Query() query: unknown,
  ): Promise<CommentListResponse> {
    const validatedQuery = CommentQuerySchema.parse(query);
    return this.commentsService.findByAuthor(authorId, validatedQuery);
  }

  /**
   * 댓글 단일 조회
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeAuthor') includeAuthor?: string,
  ): Promise<CommentResponse | CommentWithAuthorResponse> {
    const shouldIncludeAuthor = includeAuthor === 'true';
    return this.commentsService.findOne(id, shouldIncludeAuthor);
  }

  /**
   * 댓글 수정
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: unknown,
  ): Promise<CommentWithAuthorResponse> {
    const validatedDto = UpdateCommentSchema.parse(updateCommentDto);

    // TODO: 실제 구현에서는 JWT에서 사용자 ID를 추출해야 함
    const userId = '507f1f77bcf86cd799439011'; // 임시 하드코딩

    return this.commentsService.update(id, validatedDto, userId);
  }

  /**
   * 댓글 삭제
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<CommentResponse> {
    // TODO: 실제 구현에서는 JWT에서 사용자 ID를 추출해야 함
    const userId = '507f1f77bcf86cd799439011'; // 임시 하드코딩

    return this.commentsService.remove(id, userId);
  }

  /**
   * 댓글 좋아요
   */
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string): Promise<CommentResponse> {
    return this.commentsService.like(id);
  }

  /**
   * 댓글 신고
   */
  @Post(':id/report')
  @HttpCode(HttpStatus.OK)
  async report(@Param('id') id: string): Promise<CommentResponse> {
    return this.commentsService.report(id);
  }
}
