import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { CategoriesService } from './categories.service';
import { CategoryModel, CategoryDocument } from '../../models/category.model';
import type { CreateCategoryDto } from '../../types/dto/category.dto.types';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let model: jest.Mocked<Model<CategoryDocument>>;

  // 테스트용 데이터
  const mockCategory = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related articles',
    color: '#FF5733',
    icon: '💻',
    parentId: undefined,
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related articles',
      color: '#FF5733',
      icon: '💻',
      parentId: undefined,
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockCreateCategoryDto: CreateCategoryDto = {
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related articles',
    color: '#FF5733',
    icon: '💻',
    order: 1,
    isActive: true,
  };

  beforeEach(async () => {
    const mockModel = jest.fn().mockImplementation((dto) => ({
      ...mockCategory,
      ...dto,
      save: jest.fn().mockResolvedValue(mockCategory),
    }));
    
    // Add static methods to the constructor function
    mockModel.findOne = jest.fn();
    mockModel.findById = jest.fn();
    mockModel.find = jest.fn();
    mockModel.countDocuments = jest.fn();
    mockModel.findByIdAndUpdate = jest.fn();
    mockModel.findByIdAndDelete = jest.fn();
    mockModel.exec = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(CategoryModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    model = module.get<Model<CategoryDocument>>(
      getModelToken(CategoryModel.name),
    ) as jest.Mocked<Model<CategoryDocument>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('새 카테고리를 성공적으로 생성해야 함', async () => {
      // Given
      model.findOne.mockResolvedValue(null);

      // When
      const result = await service.create(mockCreateCategoryDto);

      // Then
      expect(model.findOne).toHaveBeenCalledWith({
        slug: mockCreateCategoryDto.slug,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', mockCreateCategoryDto.name);
      expect(result).toHaveProperty('slug', mockCreateCategoryDto.slug);
    });

    it('중복된 슬러그가 있으면 ConflictException을 던져야 함', async () => {
      // Given
      model.findOne.mockResolvedValue(mockCategory as any);

      // When & Then
      await expect(service.create(mockCreateCategoryDto)).rejects.toThrow(
        ConflictException,
      );
      expect(model.findOne).toHaveBeenCalledWith({
        slug: mockCreateCategoryDto.slug,
      });
    });

    it('존재하지 않는 부모 카테고리를 지정하면 NotFoundException을 던져야 함', async () => {
      // Given
      const dtoWithParent = {
        ...mockCreateCategoryDto,
        parentId: '507f1f77bcf86cd799439012',
      };
      
      model.findOne.mockResolvedValue(null); // 슬러그 중복 없음
      model.findById.mockResolvedValue(null); // 부모 카테고리 없음

      // When & Then
      await expect(service.create(dtoWithParent)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('ID로 카테고리를 조회해야 함', async () => {
      // Given
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      // When
      const result = await service.findOne('507f1f77bcf86cd799439011');

      // Then
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'Technology');
    });

    it('존재하지 않는 ID로 조회하면 NotFoundException을 던져야 함', async () => {
      // Given
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // When & Then
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('슬러그로 카테고리를 조회해야 함', async () => {
      // Given
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      // When
      const result = await service.findBySlug('technology');

      // Then
      expect(model.findOne).toHaveBeenCalledWith({ slug: 'technology' });
      expect(result).toHaveProperty('slug', 'technology');
    });

    it('존재하지 않는 슬러그로 조회하면 NotFoundException을 던져야 함', async () => {
      // Given
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // When & Then
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('카테고리를 성공적으로 삭제해야 함', async () => {
      // Given
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);
      
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]), // 자식 카테고리 없음
      } as any);
      
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      // When
      await service.remove('507f1f77bcf86cd799439011');

      // Then
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(model.find).toHaveBeenCalledWith({ parentId: '507f1f77bcf86cd799439011' });
      expect(model.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('자식 카테고리가 있으면 ConflictException을 던져야 함', async () => {
      // Given
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);
      
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockCategory]), // 자식 카테고리 존재
      } as any);

      // When & Then
      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getTree', () => {
    it('카테고리 트리 구조를 반환해야 함', async () => {
      // Given
      const categories = [
        { ...mockCategory, id: '1', parentId: undefined, name: 'Root' },
        { ...mockCategory, id: '2', parentId: '1', name: 'Child' },
      ];
      
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(categories),
        }),
      } as any);

      // When
      const result = await service.getTree();

      // Then
      expect(Array.isArray(result)).toBe(true);
      expect(model.find).toHaveBeenCalledWith({ isActive: true });
    });
  });
});