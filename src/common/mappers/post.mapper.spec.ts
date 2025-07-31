import { Types } from 'mongoose';
import { PostMapper } from './post.mapper';
import { PostDocument } from '../../models/post.model';
import { UserDocument } from '../../models/user.model';
import { CategoryDocument } from '../../models/category.model';

describe('PostMapper', () => {
  const mockPostData = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    title: 'Test Post',
    slug: 'test-post',
    content: 'This is test content',
    excerpt: 'Test excerpt',
    authorId: new Types.ObjectId('507f1f77bcf86cd799439012'),
    categoryIds: [new Types.ObjectId('507f1f77bcf86cd799439013')],
    tags: ['test', 'post'],
    status: 'published' as const,
    isPublic: true,
    allowComments: true,
    isFeatured: false,
    viewCount: 10,
    likeCount: 5,
    commentCount: 2,
    thumbnail: 'https://example.com/image.jpg',
    metaTitle: 'Meta Title',
    metaDescription: 'Meta Description',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toJSON: jest.fn(),
  };

  const mockUserData = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toJSON: jest.fn(),
  };

  const mockCategoryData = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'Test Category',
    slug: 'test-category',
    color: '#FF0000',
    order: 0,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    toJSON: jest.fn(),
  };

  beforeEach(() => {
    // toJSON 메서드가 _id를 id로 변환한 객체를 반환하도록 설정
    mockPostData.toJSON.mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      title: mockPostData.title,
      slug: mockPostData.slug,
      content: mockPostData.content,
      excerpt: mockPostData.excerpt,
      authorId: '507f1f77bcf86cd799439012',
      categoryIds: ['507f1f77bcf86cd799439013'],
      tags: mockPostData.tags,
      status: mockPostData.status,
      isPublic: mockPostData.isPublic,
      allowComments: mockPostData.allowComments,
      isFeatured: mockPostData.isFeatured,
      viewCount: mockPostData.viewCount,
      likeCount: mockPostData.likeCount,
      commentCount: mockPostData.commentCount,
      thumbnail: mockPostData.thumbnail,
      metaTitle: mockPostData.metaTitle,
      metaDescription: mockPostData.metaDescription,
      publishedAt: mockPostData.publishedAt,
      createdAt: mockPostData.createdAt,
      updatedAt: mockPostData.updatedAt,
    });

    mockUserData.toJSON.mockReturnValue({
      id: '507f1f77bcf86cd799439012',
      email: mockUserData.email,
      name: mockUserData.name,
      role: mockUserData.role,
      isActive: mockUserData.isActive,
      createdAt: mockUserData.createdAt,
      updatedAt: mockUserData.updatedAt,
    });

    mockCategoryData.toJSON.mockReturnValue({
      id: '507f1f77bcf86cd799439013',
      name: mockCategoryData.name,
      slug: mockCategoryData.slug,
      color: mockCategoryData.color,
      order: mockCategoryData.order,
      isActive: mockCategoryData.isActive,
      createdAt: mockCategoryData.createdAt,
      updatedAt: mockCategoryData.updatedAt,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = PostMapper.toEntity(mockPostData as unknown as PostDocument);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.title).toBe('Test Post');
      expect(result.authorId).toBe('507f1f77bcf86cd799439012');
      expect(result.categoryIds).toEqual(['507f1f77bcf86cd799439013']);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for null document', () => {
      expect(() => PostMapper.toEntity(null as unknown as PostDocument)).toThrow(
        'Document is required',
      );
    });
  });

  describe('documentToResponse', () => {
    it('should convert document to response', () => {
      const result = PostMapper.documentToResponse(mockPostData as unknown as PostDocument);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.title).toBe('Test Post');
      expect(result.authorId).toBe('507f1f77bcf86cd799439012');
    });

    it('should throw error for null document', () => {
      expect(() =>
        PostMapper.documentToResponse(null as unknown as PostDocument),
      ).toThrow('Document is required');
    });
  });

  describe('toResponseWithAuthor', () => {
    it('should convert post with author to response', () => {
      const result = PostMapper.toResponseWithAuthor(
        mockPostData as unknown as PostDocument,
        mockUserData as unknown as UserDocument,
      );

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.title).toBe('Test Post');
      expect(result.author).toBeDefined();
      expect(result.author.id).toBe('507f1f77bcf86cd799439012');
      expect(result.author.name).toBe('Test User');
    });

    it('should throw error for missing documents', () => {
      expect(() =>
        PostMapper.toResponseWithAuthor(
          null as unknown as PostDocument,
          mockUserData as unknown as UserDocument,
        ),
      ).toThrow('Both post and author documents are required');
    });
  });

  describe('toResponseWithCategories', () => {
    it('should convert post with categories to response', () => {
      const result = PostMapper.toResponseWithCategories(
        mockPostData as unknown as PostDocument,
        [mockCategoryData as unknown as CategoryDocument],
      );

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.title).toBe('Test Post');
      expect(result.categories).toBeDefined();
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].id).toBe('507f1f77bcf86cd799439013');
      expect(result.categories[0].name).toBe('Test Category');
    });

    it('should throw error for missing post document', () => {
      expect(() =>
        PostMapper.toResponseWithCategories(
          null as unknown as PostDocument,
          [mockCategoryData as unknown as CategoryDocument],
        ),
      ).toThrow('Post document is required');
    });
  });

  describe('toResponseWithRelations', () => {
    it('should convert post with all relations to response', () => {
      const result = PostMapper.toResponseWithRelations(
        mockPostData as unknown as PostDocument,
        mockUserData as unknown as UserDocument,
        [mockCategoryData as unknown as CategoryDocument],
      );

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.title).toBe('Test Post');
      expect(result.author).toBeDefined();
      expect(result.author.id).toBe('507f1f77bcf86cd799439012');
      expect(result.categories).toBeDefined();
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].id).toBe('507f1f77bcf86cd799439013');
    });
  });

  describe('populatedDocumentToResponse', () => {
    it('should handle document with author populated', () => {
      const populatedDoc = {
        ...mockPostData,
        authorId: mockUserData,
      };

      const result = PostMapper.populatedDocumentToResponse(
        populatedDoc as unknown as PostDocument & { authorId?: UserDocument },
      );

      expect(result).toHaveProperty('author');
    });

    it('should handle document with categories populated', () => {
      const populatedDoc = {
        ...mockPostData,
        categoryIds: [mockCategoryData],
      };

      const result = PostMapper.populatedDocumentToResponse(
        populatedDoc as unknown as PostDocument & { categoryIds?: CategoryDocument[] },
      );

      expect(result).toHaveProperty('categories');
    });

    it('should handle document with all relations populated', () => {
      const populatedDoc = {
        ...mockPostData,
        authorId: mockUserData,
        categoryIds: [mockCategoryData],
      };

      const result = PostMapper.populatedDocumentToResponse(
        populatedDoc as unknown as PostDocument & { 
          authorId?: UserDocument;
          categoryIds?: CategoryDocument[];
        },
      );

      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('categories');
    });

    it('should handle document without populated relations', () => {
      const result = PostMapper.populatedDocumentToResponse(
        mockPostData as unknown as PostDocument,
      );

      expect(result).not.toHaveProperty('author');
      expect(result).not.toHaveProperty('categories');
    });
  });

  describe('array conversion methods', () => {
    it('should convert multiple documents to entities', () => {
      const documents = [mockPostData, mockPostData] as unknown as PostDocument[];
      const result = PostMapper.toEntities(documents);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('507f1f77bcf86cd799439011');
    });

    it('should convert multiple documents to responses', () => {
      const documents = [mockPostData, mockPostData] as unknown as PostDocument[];
      const result = PostMapper.documentsToResponses(documents);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('507f1f77bcf86cd799439011');
    });
  });
});