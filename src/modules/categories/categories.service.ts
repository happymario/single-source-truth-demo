import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryModel, CategoryDocument } from '../../models/category.model';
import { CategoryMapper } from '../../common/mappers/category.mapper';
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
 * 카테고리 서비스
 * 타입 안전한 CRUD 작업 및 비즈니스 로직 처리
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryModel.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * 카테고리 생성
   */
  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    // 슬러그 중복 검사
    const existingCategory = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingCategory) {
      throw new ConflictException('Slug already exists');
    }

    // 부모 카테고리 존재 검사
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryModel.findById(
        createCategoryDto.parentId,
      );
      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    // 카테고리 생성
    const category = new this.categoryModel(createCategoryDto);
    const savedCategory = await category.save();

    return CategoryMapper.documentToResponse(savedCategory);
  }

  /**
   * 카테고리 목록 조회 (페이지네이션, 검색, 필터링)
   */
  async findAll(query: CategoryQueryDto): Promise<CategoryListResponse> {
    const {
      page = 1,
      limit = 10,
      name,
      slug,
      parentId,
      isActive,
      sortBy = 'order',
      sortOrder = 'asc',
    } = query;

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // 대소문자 무시 검색
    }

    if (slug) {
      filter.slug = slug;
    }

    if (parentId) {
      filter.parentId = parentId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // 정렬 옵션
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 데이터 조회
    const [categories, total] = await Promise.all([
      this.categoryModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    // 응답 데이터 구성
    const data = CategoryMapper.documentsToResponses(categories);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * ID로 카테고리 조회
   */
  async findOne(id: string): Promise<CategoryResponse> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return CategoryMapper.documentToResponse(category);
  }

  /**
   * 슬러그로 카테고리 조회
   */
  async findBySlug(slug: string): Promise<CategoryResponse> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return CategoryMapper.documentToResponse(category);
  }

  /**
   * 카테고리 수정
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // 슬러그 변경 시 중복 검사 (기존 슬러그와 다를 경우만)
    if (
      updateCategoryDto.slug &&
      updateCategoryDto.slug !== (category as { slug: string }).slug
    ) {
      const existingCategory = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new ConflictException('Slug already exists');
      }
    }

    // 부모 카테고리 존재 검사
    if (updateCategoryDto.parentId) {
      const parentCategory = await this.categoryModel.findById(
        updateCategoryDto.parentId,
      );
      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${updateCategoryDto.parentId} not found`,
        );
      }

      // 순환 참조 방지 (자기 자신을 부모로 설정 불가)
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }
    }

    // 데이터 업데이트
    const updateData: Record<string, unknown> = { ...updateCategoryDto };

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    return CategoryMapper.documentToResponse(updatedCategory!);
  }

  /**
   * 카테고리 삭제
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // 자식 카테고리 존재 검사
    const childCategories = await this.categoryModel
      .find({ parentId: id })
      .exec();
    if (childCategories.length > 0) {
      throw new ConflictException(
        'Cannot delete category with child categories',
      );
    }

    await this.categoryModel.findByIdAndDelete(id).exec();
  }

  /**
   * 카테고리 트리 구조 조회
   */
  async getTree(): Promise<CategoryResponse[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .exec();

    const categoryResponses = CategoryMapper.documentsToResponses(categories);

    // 트리 구조 생성
    return this.buildTree(categoryResponses);
  }

  /**
   * 카테고리 트리 구조 생성 헬퍼 메서드
   */
  private buildTree(categories: CategoryResponse[]): CategoryResponse[] {
    const categoryMap = new Map<
      string,
      CategoryResponse & { children?: CategoryResponse[] }
    >();
    const rootCategories: (CategoryResponse & {
      children?: CategoryResponse[];
    })[] = [];

    // 모든 카테고리를 맵에 저장
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 트리 구조 생성
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)!;

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }
}
