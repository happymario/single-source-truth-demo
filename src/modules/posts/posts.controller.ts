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
import { ZodQuery, ZodParam, ZodBody } from '../../common/decorators';
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
  PostStatsQuerySchema,
} from '../../schemas/query/post.query.schema';
import {
  CreatePostResponseSchema,
  UpdatePostResponseSchema,
  DeletePostResponseSchema,
} from '../../schemas/response/post.response.schema';
import type {
  CreatePostDto,
  UpdatePostDto,
  ChangePostStatusDto,
} from '../../types/dto/post.dto.types';
import type {
  PostListQueryDto,
  PostFindQueryDto,
  PostIdParamDto,
  PostSlugParamDto,
  PostStatsQueryDto,
} from '../../types/query/post.query.types';

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
  @ZodBody(CreatePostSchema)
  async create(@Body() createPostDto: CreatePostDto) {
    // ZodBody 데코레이터에서 이미 검증되었으므로 바로 사용
    const post = await this.postsService.create(createPostDto);

    return CreatePostResponseSchema.parse({
      message: '게시물이 성공적으로 생성되었습니다.',
      post,
    });
  }

  /**
   * 게시물 목록 조회
   */
  @Get()
  async findAll(@ZodQuery(PostListQuerySchema) query: PostListQueryDto) {
    return this.postsService.findAll(query);
  }

  /**
   * 게시물 통계 조회
   */
  @Get('stats')
  async getStats(@ZodQuery(PostStatsQuerySchema) query: PostStatsQueryDto) {
    return this.postsService.getStats(query);
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
    @ZodParam(PostIdParamSchema) params: PostIdParamDto,
    @ZodQuery(PostListQuerySchema) query: PostListQueryDto,
  ) {
    const { id: authorId } = params;
    return this.postsService.findByAuthor(authorId, query);
  }

  /**
   * 카테고리별 게시물 조회
   */
  @Get('category/:categoryId')
  async findByCategory(
    @ZodParam(PostIdParamSchema) params: PostIdParamDto,
    @ZodQuery(PostListQuerySchema) query: PostListQueryDto,
  ) {
    const { id: categoryId } = params;
    return this.postsService.findByCategory(categoryId, query);
  }

  /**
   * 태그별 게시물 조회
   */
  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @ZodQuery(PostListQuerySchema) query: PostListQueryDto,
  ) {
    return this.postsService.findByTag(tag, query);
  }

  /**
   * 게시물 단일 조회 (ID)
   */
  @Get('id/:id')
  async findOneById(
    @ZodParam(PostIdParamSchema) params: PostIdParamDto,
    @ZodQuery(PostFindQuerySchema) query: PostFindQueryDto,
  ) {
    const { id } = params;
    return this.postsService.findOne(id, query);
  }

  /**
   * 게시물 단일 조회 (슬러그)
   */
  @Get(':slug')
  async findOneBySlug(
    @ZodParam(PostSlugParamSchema) params: PostSlugParamDto,
    @ZodQuery(PostFindQuerySchema) query: PostFindQueryDto,
  ) {
    const { slug } = params;
    return this.postsService.findOne(slug, query);
  }

  /**
   * 게시물 수정
   */
  @Patch(':id')
  @ZodBody(UpdatePostSchema)
  async update(
    @ZodParam(PostIdParamSchema) params: PostIdParamDto,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const { id } = params;
    // ZodBody 데코레이터에서 이미 검증되었으므로 바로 사용
    const post = await this.postsService.update(id, updatePostDto);

    return UpdatePostResponseSchema.parse({
      message: '게시물이 성공적으로 수정되었습니다.',
      post,
    });
  }

  /**
   * 게시물 상태 변경
   */
  @Patch(':id/status')
  @ZodBody(ChangePostStatusSchema)
  async changeStatus(
    @ZodParam(PostIdParamSchema) params: PostIdParamDto,
    @Body() statusDto: ChangePostStatusDto,
  ) {
    const { id } = params;
    // ZodBody 데코레이터에서 이미 검증되었으므로 바로 사용
    const post = await this.postsService.changeStatus(id, statusDto);

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
  async remove(@ZodParam(PostIdParamSchema) params: PostIdParamDto) {
    const { id } = params;
    await this.postsService.remove(id);

    return DeletePostResponseSchema.parse({
      message: '게시물이 성공적으로 삭제되었습니다.',
      deletedId: id,
    });
  }
}
