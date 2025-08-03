import { CategoryMasterSchema } from './category.schema';

describe('CategoryMasterSchema', () => {
  const validCategory = {
    id: '507f1f77bcf86cd799439011',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related articles and discussions',
    color: '#FF5733',
    icon: '💻',
    parentId: '507f1f77bcf86cd799439012',
    order: 1,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  };

  describe('Valid cases', () => {
    it('should validate a complete category', () => {
      const result = CategoryMasterSchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should validate category without optional fields', () => {
      const minimalCategory = {
        id: '507f1f77bcf86cd799439011',
        name: 'Tech',
        slug: 'tech',
        color: '#FF5733',
        order: 0,
        isActive: true,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-02T00:00:00.000Z'),
      };

      const result = CategoryMasterSchema.safeParse(minimalCategory);
      expect(result.success).toBe(true);
    });

    it('should validate Korean category name', () => {
      const koreanCategory = {
        ...validCategory,
        name: '기술 카테고리',
      };

      const result = CategoryMasterSchema.safeParse(koreanCategory);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid cases', () => {
    it('should reject invalid ObjectId format', () => {
      const invalidCategory = {
        ...validCategory,
        id: 'invalid-id',
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should reject empty name', () => {
      const invalidCategory = {
        ...validCategory,
        name: '',
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should reject name longer than 50 characters', () => {
      const invalidCategory = {
        ...validCategory,
        name: 'a'.repeat(51),
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should reject invalid characters in name', () => {
      const invalidCategory = {
        ...validCategory,
        name: 'Tech@Category!',
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name']);
      }
    });

    it('should reject invalid slug format', () => {
      const invalidCategory = {
        ...validCategory,
        slug: 'Invalid Slug',
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['slug']);
      }
    });

    it('should reject description longer than 500 characters', () => {
      const invalidCategory = {
        ...validCategory,
        description: 'a'.repeat(501),
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['description']);
      }
    });

    it('should reject invalid hex color', () => {
      const invalidCategory = {
        ...validCategory,
        color: 'red',
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['color']);
      }
    });

    it('should reject negative order', () => {
      const invalidCategory = {
        ...validCategory,
        order: -1,
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['order']);
      }
    });

    it('should reject order greater than 9999', () => {
      const invalidCategory = {
        ...validCategory,
        order: 10000,
      };

      const result = CategoryMasterSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['order']);
      }
    });
  });
});
