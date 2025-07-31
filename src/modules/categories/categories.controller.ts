import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ZodBody, ZodQuery } from '../../common/decorators';
import { ObjectIdSchema } from '../../schemas/shared/common.schema';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../../schemas/dto/category.dto.schema';
import { CategoryQuerySchema } from '../../schemas/query/category.query.schema';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from '../../types/dto/category.dto.types';
import type {
  CategoryResponse,
  CategoryListResponse,
} from '../../types/api/category.response.types';

/**
 * 카테고리 컨트롤러
 * RESTful API 엔드포인트 제공
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * 카테고리 생성
   * POST /categories
   */
  @Post()
  @ZodBody(CreateCategorySchema)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * 카테고리 목록 조회
   * GET /categories
   */
  @Get()
  async findAll(
    @ZodQuery(CategoryQuerySchema) query: CategoryQueryDto,
  ): Promise<CategoryListResponse> {
    return this.categoriesService.findAll(query);
  }

  /**
   * 카테고리 트리 구조 조회
   * GET /categories/tree
   */
  @Get('tree')
  async getTree(): Promise<CategoryResponse[]> {
    return this.categoriesService.getTree();
  }

  /**
   * 슬러그로 카테고리 조회
   * GET /categories/slug/:slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponse> {
    return this.categoriesService.findBySlug(slug);
  }

  /**
   * ID로 카테고리 조회
   * GET /categories/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponse> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.categoriesService.findOne(id);
  }

  /**
   * 카테고리 수정
   * PATCH /categories/:id
   */
  @Patch(':id')
  @ZodBody(UpdateCategorySchema)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * 카테고리 삭제
   * DELETE /categories/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.categoriesService.remove(id);
  }
}
