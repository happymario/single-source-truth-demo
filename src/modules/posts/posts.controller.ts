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
import { ZodBody, ZodQuery, ZodParam } from '../../common/decorators';
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
  async create(@Body() createPostDto: any) {
    const validatedDto = CreatePostSchema.parse(createPostDto);
    const post = await this.postsService.create(validatedDto);

    return CreatePostResponseSchema.parse({
      message: '게시물이 성공적으로 생성되었습니다.',
      post,
    });
  }

  /**
   * 게시물 목록 조회
   */
  @Get()
  async findAll(@ZodQuery(PostListQuerySchema) query: any) {
    return this.postsService.findAll(query);
  }

  /**
   * 게시물 통계 조회
   */
  @Get('stats')
  async getStats(@ZodQuery(PostStatsQuerySchema) query: any) {
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
    @ZodParam(PostIdParamSchema) params: any,
    @ZodQuery(PostListQuerySchema) query: any,
  ) {
    const { authorId } = params as { authorId: string };
    return this.postsService.findByAuthor(authorId, query);
  }

  /**
   * 카테고리별 게시물 조회
   */
  @Get('category/:categoryId')
  async findByCategory(
    @ZodParam(PostIdParamSchema) params: any,
    @ZodQuery(PostListQuerySchema) query: any,
  ) {
    const { categoryId } = params as { categoryId: string };
    return this.postsService.findByCategory(categoryId, query);
  }

  /**
   * 태그별 게시물 조회
   */
  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @ZodQuery(PostListQuerySchema) query: any,
  ) {
    return this.postsService.findByTag(tag, query);
  }

  /**
   * 게시물 단일 조회 (ID)
   */
  @Get('id/:id')
  async findOneById(
    @ZodParam(PostIdParamSchema) params: any,
    @ZodQuery(PostFindQuerySchema) query: any,
  ) {
    const { id } = params as { id: string };
    return this.postsService.findOne(id, query);
  }

  /**
   * 게시물 단일 조회 (슬러그)
   */
  @Get(':slug')
  async findOneBySlug(
    @ZodParam(PostSlugParamSchema) params: any,
    @ZodQuery(PostFindQuerySchema) query: any,
  ) {
    const { slug } = params as { slug: string };
    return this.postsService.findOne(slug, query);
  }

  /**
   * 게시물 수정
   */
  @Patch(':id')
  async update(
    @ZodParam(PostIdParamSchema) params: any,
    @Body() updatePostDto: any,
  ) {
    const { id } = params as { id: string };
    const validatedDto = UpdatePostSchema.parse(updatePostDto);
    const post = await this.postsService.update(id, validatedDto);

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
    @ZodParam(PostIdParamSchema) params: any,
    @Body() statusDto: any,
  ) {
    const { id } = params as { id: string };
    const validatedDto = ChangePostStatusSchema.parse(statusDto);
    const post = await this.postsService.changeStatus(id, validatedDto);

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
  async remove(@ZodParam(PostIdParamSchema) params: any) {
    const { id } = params as { id: string };
    await this.postsService.remove(id);

    return DeletePostResponseSchema.parse({
      message: '게시물이 성공적으로 삭제되었습니다.',
      deletedId: id,
    });
  }
}
