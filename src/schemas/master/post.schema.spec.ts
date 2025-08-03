import { PostMasterSchema, PostMaster } from './post.schema';

describe('PostMasterSchema', () => {
  const validPostData: PostMaster = {
    id: '507f1f77bcf86cd799439011',
    title: 'Test Post Title',
    slug: 'test-post-title',
    content: 'This is a test post content.',
    authorId: '507f1f77bcf86cd799439012',
    categoryIds: ['507f1f77bcf86cd799439013'],
    tags: ['test', 'post'],
    status: 'published',
    isPublic: true,
    allowComments: true,
    isFeatured: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Valid data validation', () => {
    it('should validate complete post data', () => {
      const result = PostMasterSchema.safeParse(validPostData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal post data', () => {
      const minimalData = {
        id: '507f1f77bcf86cd799439011',
        title: 'Minimal Post',
        slug: 'minimal-post',
        content: 'Content',
        authorId: '507f1f77bcf86cd799439012',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = PostMasterSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should apply default values correctly', () => {
      const dataWithDefaults = {
        id: '507f1f77bcf86cd799439011',
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        authorId: '507f1f77bcf86cd799439012',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = PostMasterSchema.parse(dataWithDefaults);

      expect(result.categoryIds).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.status).toBe('draft');
      expect(result.isPublic).toBe(true);
      expect(result.allowComments).toBe(true);
      expect(result.isFeatured).toBe(false);
      expect(result.viewCount).toBe(0);
      expect(result.likeCount).toBe(0);
      expect(result.commentCount).toBe(0);
    });
  });

  describe('Invalid data validation', () => {
    it('should reject invalid ObjectId format', () => {
      const invalidData = { ...validPostData, id: 'invalid-id' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidData = { ...validPostData, title: '' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title too long', () => {
      const invalidData = { ...validPostData, title: 'a'.repeat(201) };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const invalidData = { ...validPostData, content: '' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content too long', () => {
      const invalidData = { ...validPostData, content: 'a'.repeat(10001) };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug format', () => {
      const invalidData = { ...validPostData, slug: 'Invalid Slug!' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid authorId format', () => {
      const invalidData = { ...validPostData, authorId: 'invalid-author-id' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid categoryId format in array', () => {
      const invalidData = {
        ...validPostData,
        categoryIds: ['invalid-category-id'],
      };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many tags', () => {
      const invalidData = { ...validPostData, tags: Array(11).fill('tag') };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject tag too long', () => {
      const invalidData = { ...validPostData, tags: ['a'.repeat(31)] };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = { ...validPostData, status: 'invalid' as any };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative counts', () => {
      const invalidData = { ...validPostData, viewCount: -1 };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid thumbnail URL', () => {
      const invalidData = { ...validPostData, thumbnail: 'not-a-url' };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject meta title too long', () => {
      const invalidData = { ...validPostData, metaTitle: 'a'.repeat(61) };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject meta description too long', () => {
      const invalidData = {
        ...validPostData,
        metaDescription: 'a'.repeat(161),
      };
      const result = PostMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept valid thumbnail URL', () => {
      const validData = {
        ...validPostData,
        thumbnail: 'https://example.com/image.jpg',
      };
      const result = PostMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid excerpt', () => {
      const validData = {
        ...validPostData,
        excerpt: 'This is a valid excerpt.',
      };
      const result = PostMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid meta fields', () => {
      const validData = {
        ...validPostData,
        metaTitle: 'SEO Title',
        metaDescription: 'SEO description for the post',
      };
      const result = PostMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept publishedAt date', () => {
      const validData = { ...validPostData, publishedAt: new Date() };
      const result = PostMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept null publishedAt', () => {
      const validData = { ...validPostData, publishedAt: null };
      const result = PostMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
