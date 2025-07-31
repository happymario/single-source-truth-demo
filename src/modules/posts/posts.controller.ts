import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { ZodQuery } from '../../common/decorators/zod-query.decorator';
import { ZodParam } from '../../common/decorators/zod-param.decorator';
import {
  CreatePostSchema,
  UpdatePostSchema,
  ChangePostStatusSchema,
} from '../../schemas/dto/post.dto.schema';
import {
  PostListQuerySchema,
  PostFindQuerySchema,
  PostIdParamSchema,
  PostSlugParamSchema,
  PostsByAuthorQuerySchema,
  PostsByCategoryQuerySchema,
  PostsByTagQuerySchema,
  PostStatsQuerySchema,
} from '../../schemas/query/post.query.schema';
import {
  CreatePostResponseSchema,
  UpdatePostResponseSchema,
  DeletePostResponseSchema,
} from '../../schemas/response/post.response.schema';

/**
 * 게시물 컨트롤러
 * RESTful API 엔드포인트 제공
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 게시물 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@ZodBody(CreatePostSchema) createPostDto: unknown) {
    const post = await this.postsService.create(createPostDto as any);
    
    return CreatePostResponseSchema.parse({
      message: '게시물이 성공적으로 생성되었습니다.',
      post,
    });
  }

  /**
   * 게시물 목록 조회
   */
  @Get()
  async findAll(@ZodQuery(PostListQuerySchema) query: unknown) {
    return this.postsService.findAll(query as any);
  }

  /**
   * 게시물 통계 조회
   */
  @Get('stats')
  async getStats(@ZodQuery(PostStatsQuerySchema) query: unknown) {
    return this.postsService.getStats(query as any);
  }

  /**
   * 인기 게시물 조회
   */
  @Get('popular')
  async findPopular(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.postsService.findPopular(parsedLimit);
  }

  /**
   * 추천 게시물 조회
   */
  @Get('featured')
  async findFeatured(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.postsService.findFeatured(parsedLimit);
  }

  /**
   * 최근 게시물 조회
   */
  @Get('recent')
  async findRecent(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.postsService.findRecent(parsedLimit);
  }

  /**
   * 작성자별 게시물 조회
   */
  @Get('author/:authorId')
  async findByAuthor(
    @ZodParam(PostIdParamSchema) params: unknown,
    @ZodQuery(PostListQuerySchema) query: unknown,
  ) {
    const { authorId } = params as any;
    return this.postsService.findByAuthor(authorId, query as any);
  }

  /**
   * 카테고리별 게시물 조회
   */
  @Get('category/:categoryId')
  async findByCategory(
    @ZodParam(PostIdParamSchema) params: unknown,
    @ZodQuery(PostListQuerySchema) query: unknown,
  ) {
    const { categoryId } = params as any;
    return this.postsService.findByCategory(categoryId, query as any);
  }

  /**
   * 태그별 게시물 조회
   */
  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @ZodQuery(PostListQuerySchema) query: unknown,
  ) {
    return this.postsService.findByTag(tag, query as any);
  }

  /**
   * 게시물 단일 조회 (ID)
   */
  @Get('id/:id')
  async findOneById(
    @ZodParam(PostIdParamSchema) params: unknown,
    @ZodQuery(PostFindQuerySchema) query: unknown,
  ) {
    const { id } = params as any;
    return this.postsService.findOne(id, query as any);
  }

  /**
   * 게시물 단일 조회 (슬러그)
   */
  @Get(':slug')
  async findOneBySlug(
    @ZodParam(PostSlugParamSchema) params: unknown,
    @ZodQuery(PostFindQuerySchema) query: unknown,
  ) {
    const { slug } = params as any;
    return this.postsService.findOne(slug, query as any);
  }

  /**
   * 게시물 수정
   */
  @Patch(':id')
  async update(
    @ZodParam(PostIdParamSchema) params: unknown,
    @ZodBody(UpdatePostSchema) updatePostDto: unknown,
  ) {
    const { id } = params as any;
    const post = await this.postsService.update(id, updatePostDto as any);
    
    return UpdatePostResponseSchema.parse({
      message: '게시물이 성공적으로 수정되었습니다.',
      post,
    });
  }

  /**
   * 게시물 상태 변경
   */
  @Patch(':id/status')
  async changeStatus(
    @ZodParam(PostIdParamSchema) params: unknown,
    @ZodBody(ChangePostStatusSchema) statusDto: unknown,
  ) {
    const { id } = params as any;
    const post = await this.postsService.changeStatus(id, statusDto as any);
    
    return UpdatePostResponseSchema.parse({
      message: '게시물 상태가 성공적으로 변경되었습니다.',
      post,
    });
  }

  /**
   * 게시물 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@ZodParam(PostIdParamSchema) params: unknown) {
    const { id } = params as any;
    await this.postsService.remove(id);
    
    return DeletePostResponseSchema.parse({
      message: '게시물이 성공적으로 삭제되었습니다.',
      deletedId: id,
    });
  }
}