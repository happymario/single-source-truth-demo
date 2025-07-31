import { CategoryMapper } from './category.mapper';
import { CategoryDocument } from '../../models/category.model';

describe('CategoryMapper', () => {
  // 테스트용 Document 목킹
  const mockCategoryDocument = {
    _id: { toHexString: () => '507f1f77bcf86cd799439011' },
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related articles',
    color: '#FF5733',
    icon: '💻',
    parentId: '507f1f77bcf86cd799439012',
    order: 1,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related articles',
      color: '#FF5733',
      icon: '💻',
      parentId: '507f1f77bcf86cd799439012',
      order: 1,
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-02T00:00:00.000Z'),
    }),
  } as unknown as CategoryDocument;

  const mockCategory = {
    id: '507f1f77bcf86cd799439011',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related articles',
    color: '#FF5733',
    icon: '💻',
    parentId: '507f1f77bcf86cd799439012',
    order: 1,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toEntity', () => {
    it('Document를 Category 엔티티로 변환해야 함', () => {
      // When
      const result = CategoryMapper.toEntity(mockCategoryDocument);

      // Then
      expect(mockCategoryDocument.toJSON).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('name', 'Technology');
      expect(result).toHaveProperty('slug', 'technology');
      expect(result).toHaveProperty('color', '#FF5733');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('Document가 null이면 에러를 던져야 함', () => {
      // When & Then
      expect(() =>
        CategoryMapper.toEntity(null as unknown as CategoryDocument),
      ).toThrow('Document is required');
    });
  });

  describe('toResponse', () => {
    it('Category 엔티티를 CategoryResponse로 변환해야 함', () => {
      // When
      const result = CategoryMapper.toResponse(mockCategory);

      // Then
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('name', 'Technology');
      expect(result).toHaveProperty('slug', 'technology');
      expect(result).toHaveProperty('description', 'Technology related articles');
      expect(result).toHaveProperty('color', '#FF5733');
      expect(result).toHaveProperty('icon', '💻');
      expect(result).toHaveProperty('parentId', '507f1f77bcf86cd799439012');
      expect(result).toHaveProperty('order', 1);
      expect(result).toHaveProperty('isActive', true);
    });
  });

  describe('documentToResponse', () => {
    it('Document를 CategoryResponse로 직접 변환해야 함', () => {
      // When
      const result = CategoryMapper.documentToResponse(mockCategoryDocument);

      // Then
      expect(mockCategoryDocument.toJSON).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('name', 'Technology');
      expect(result).toHaveProperty('slug', 'technology');
    });

    it('Document가 null이면 에러를 던져야 함', () => {
      // When & Then
      expect(() =>
        CategoryMapper.documentToResponse(null as unknown as CategoryDocument),
      ).toThrow('Document is required');
    });
  });

  describe('toEntities', () => {
    it('Document 배열을 Category 엔티티 배열로 변환해야 함', () => {
      // Given
      const documents = [mockCategoryDocument, mockCategoryDocument];

      // When
      const result = CategoryMapper.toEntities(documents);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[1]).toHaveProperty('id', '507f1f77bcf86cd799439011');
    });
  });

  describe('documentsToResponses', () => {
    it('Document 배열을 CategoryResponse 배열로 변환해야 함', () => {
      // Given
      const documents = [mockCategoryDocument, mockCategoryDocument];

      // When
      const result = CategoryMapper.documentsToResponses(documents);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[1]).toHaveProperty('id', '507f1f77bcf86cd799439011');
    });
  });

  describe('entitiesToResponses', () => {
    it('Category 엔티티 배열을 CategoryResponse 배열로 변환해야 함', () => {
      // Given
      const entities = [mockCategory, mockCategory];

      // When
      const result = CategoryMapper.entitiesToResponses(entities);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[1]).toHaveProperty('id', '507f1f77bcf86cd799439011');
    });
  });
});