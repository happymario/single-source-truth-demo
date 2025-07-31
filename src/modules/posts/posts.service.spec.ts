import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostModel } from '../../models/post.model';
import { UserModel } from '../../models/user.model';
import { CategoryModel } from '../../models/category.model';
import { CreatePostDto } from '../../types/dto/post.dto.types';

describe('PostsService', () => {
  let service: PostsService;
  let postModel: any;
  let userModel: any;
  let categoryModel: any;

  const mockPost = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Post',
    slug: 'test-post',
    content: 'Test content',
    authorId: '507f1f77bcf86cd799439012',
    categoryIds: ['507f1f77bcf86cd799439013'],
    tags: ['test'],
    status: 'draft',
    isPublic: true,
    allowComments: true,
    isFeatured: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      authorId: '507f1f77bcf86cd799439012',
      categoryIds: ['507f1f77bcf86cd799439013'],
      tags: ['test'],
      status: 'draft',
      isPublic: true,
      allowComments: true,
      isFeatured: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockCategory = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Test Category',
    slug: 'test-category',
  };

  beforeEach(async () => {
    const mockPostModel = jest.fn().mockImplementation(() => mockPost);
    mockPostModel.findOne = jest.fn();
    mockPostModel.findById = jest.fn();
    mockPostModel.countDocuments = jest.fn();
    mockPostModel.find = jest.fn().mockReturnThis();
    mockPostModel.sort = jest.fn().mockReturnThis();
    mockPostModel.skip = jest.fn().mockReturnThis();
    mockPostModel.limit = jest.fn().mockReturnThis();
    mockPostModel.exec = jest.fn();
    mockPostModel.findByIdAndUpdate = jest.fn();
    mockPostModel.deleteOne = jest.fn();
    mockPostModel.updateOne = jest.fn();
    mockPostModel.aggregate = jest.fn();

    const mockUserModel = {
      findById: jest.fn(),
    };

    const mockCategoryModel = {
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(PostModel.name),
          useValue: mockPostModel,
        },
        {
          provide: getModelToken(UserModel.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(CategoryModel.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postModel = module.get(getModelToken(PostModel.name));
    userModel = module.get(getModelToken(UserModel.name));
    categoryModel = module.get(getModelToken(CategoryModel.name));
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      authorId: '507f1f77bcf86cd799439012',
      categoryIds: ['507f1f77bcf86cd799439013'],
      tags: ['test'],
      status: 'draft',
      isPublic: true,
      allowComments: true,
      isFeatured: false,
    };

    it('should create a post successfully', async () => {
      postModel.findOne.mockResolvedValue(null);
      userModel.findById.mockResolvedValue(mockUser);
      categoryModel.countDocuments.mockResolvedValue(1);
      mockPost.save.mockResolvedValue(mockPost);

      const result = await service.create(createPostDto);

      expect(postModel.findOne).toHaveBeenCalledWith({ slug: 'test-post' });
      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(categoryModel.countDocuments).toHaveBeenCalledWith({
        _id: { $in: ['507f1f77bcf86cd799439013'] },
      });
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Post');
    });

    it('should throw ConflictException if slug already exists', async () => {
      postModel.findOne.mockResolvedValue(mockPost);

      await expect(service.create(createPostDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if author not found', async () => {
      postModel.findOne.mockResolvedValue(null);
      userModel.findById.mockResolvedValue(null);

      await expect(service.create(createPostDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      postModel.findOne.mockResolvedValue(null);
      userModel.findById.mockResolvedValue(mockUser);
      categoryModel.countDocuments.mockResolvedValue(0);

      await expect(service.create(createPostDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const queryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    it('should return paginated posts', async () => {
      const mockPosts = [mockPost];
      postModel.exec.mockResolvedValue(mockPosts);
      postModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      const searchQuery = { ...queryDto, search: 'test' };
      postModel.exec.mockResolvedValue([]);
      postModel.countDocuments.mockResolvedValue(0);

      await service.findAll(searchQuery);

      expect(postModel.find).toHaveBeenCalledWith({
        $text: { $search: 'test' },
      });
    });

    it('should apply author filter', async () => {
      const authorQuery = { ...queryDto, authorId: '507f1f77bcf86cd799439012' };
      postModel.exec.mockResolvedValue([]);
      postModel.countDocuments.mockResolvedValue(0);

      await service.findAll(authorQuery);

      expect(postModel.find).toHaveBeenCalledWith({
        authorId: '507f1f77bcf86cd799439012',
      });
    });
  });

  describe('findOne', () => {
    it('should find post by ID', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      };
      postModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(postModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(result).toBeDefined();
    });

    it('should find post by slug', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      };
      postModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findOne('test-post');

      expect(postModel.findOne).toHaveBeenCalledWith({ slug: 'test-post' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if post not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      postModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should increment view count when requested', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      };
      postModel.findOne.mockReturnValue(mockQuery);
      postModel.updateOne.mockResolvedValue({});

      await service.findOne('507f1f77bcf86cd799439011', {
        incrementView: true,
      });

      expect(postModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPost._id },
        { $inc: { viewCount: 1 } },
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Post',
      content: 'Updated content',
    };

    it('should update post successfully', async () => {
      postModel.findById.mockResolvedValue(mockPost);
      postModel.findByIdAndUpdate.mockResolvedValue({
        ...mockPost,
        ...updateDto,
      });

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(postModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(postModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        { new: true },
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if post not found', async () => {
      postModel.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should check slug uniqueness when updating slug', async () => {
      const updateWithSlug = { ...updateDto, slug: 'new-slug' };
      postModel.findById.mockResolvedValue(mockPost);
      postModel.findOne.mockResolvedValue(null);
      postModel.findByIdAndUpdate.mockResolvedValue({
        ...mockPost,
        ...updateWithSlug,
      });

      await service.update('507f1f77bcf86cd799439011', updateWithSlug);

      expect(postModel.findOne).toHaveBeenCalledWith({
        slug: 'new-slug',
        _id: { $ne: '507f1f77bcf86cd799439011' },
      });
    });
  });

  describe('remove', () => {
    it('should delete post successfully', async () => {
      postModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.remove('507f1f77bcf86cd799439011');

      expect(postModel.deleteOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      postModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    it('should return post statistics', async () => {
      postModel.countDocuments
        .mockResolvedValueOnce(100) // totalPosts
        .mockResolvedValueOnce(80) // publishedPosts
        .mockResolvedValueOnce(15) // draftPosts
        .mockResolvedValueOnce(5); // archivedPosts

      postModel.aggregate
        .mockResolvedValueOnce([{ total: 1000 }]) // totalViews
        .mockResolvedValueOnce([{ total: 500 }]) // totalLikes
        .mockResolvedValueOnce([{ total: 250 }]); // totalComments

      const result = await service.getStats();

      expect(result).toEqual({
        totalPosts: 100,
        publishedPosts: 80,
        draftPosts: 15,
        archivedPosts: 5,
        totalViews: 1000,
        totalLikes: 500,
        totalComments: 250,
        averageViewsPerPost: 10,
        averageLikesPerPost: 5,
        averageCommentsPerPost: 2.5,
      });
    });

    it('should handle empty stats gracefully', async () => {
      postModel.countDocuments.mockResolvedValue(0);
      postModel.aggregate.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.totalPosts).toBe(0);
      expect(result.averageViewsPerPost).toBe(0);
    });
  });
});