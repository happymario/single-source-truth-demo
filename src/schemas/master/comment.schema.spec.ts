import { CommentMasterSchema, CommentMaster } from './comment.schema';

describe('CommentMasterSchema', () => {
  const validCommentData: CommentMaster = {
    id: '507f1f77bcf86cd799439011',
    content: 'This is a test comment.',
    authorId: '507f1f77bcf86cd799439012',
    postId: '507f1f77bcf86cd799439013',
    parentId: null,
    depth: 0,
    childIds: [],
    path: [],
    status: 'active',
    likeCount: 0,
    reportCount: 0,
    isEdited: false,
    isDeleted: false,
    deletedAt: null,
    mentionedUserIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Valid data validation', () => {
    it('should validate complete comment data', () => {
      const result = CommentMasterSchema.safeParse(validCommentData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal comment data', () => {
      const minimalData = {
        id: '507f1f77bcf86cd799439011',
        content: 'Minimal comment',
        authorId: '507f1f77bcf86cd799439012',
        postId: '507f1f77bcf86cd799439013',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = CommentMasterSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should validate reply comment with parentId', () => {
      const replyData = {
        ...validCommentData,
        parentId: '507f1f77bcf86cd799439014',
        depth: 1,
        path: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439011'],
      };
      const result = CommentMasterSchema.safeParse(replyData);
      expect(result.success).toBe(true);
    });

    it('should apply default values correctly', () => {
      const dataWithDefaults = {
        id: '507f1f77bcf86cd799439011',
        content: 'Test comment',
        authorId: '507f1f77bcf86cd799439012',
        postId: '507f1f77bcf86cd799439013',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = CommentMasterSchema.parse(dataWithDefaults);

      expect(result.depth).toBe(0);
      expect(result.childIds).toEqual([]);
      expect(result.path).toEqual([]);
      expect(result.status).toBe('active');
      expect(result.likeCount).toBe(0);
      expect(result.reportCount).toBe(0);
      expect(result.isEdited).toBe(false);
      expect(result.isDeleted).toBe(false);
      expect(result.mentionedUserIds).toEqual([]);
    });

    it('should validate comment with metadata', () => {
      const dataWithMetadata = {
        ...validCommentData,
        metadata: {
          ipHash: 'hashed-ip-address',
          userAgent: 'Mozilla/5.0...',
          editHistory: [
            {
              editedAt: new Date(),
              previousContent: 'Previous content',
            },
          ],
        },
      };
      const result = CommentMasterSchema.safeParse(dataWithMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid data validation', () => {
    it('should reject invalid ObjectId format', () => {
      const invalidData = { ...validCommentData, id: 'invalid-id' };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const invalidData = { ...validCommentData, content: '' };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content too long', () => {
      const invalidData = { ...validCommentData, content: 'a'.repeat(1001) };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid authorId format', () => {
      const invalidData = { ...validCommentData, authorId: 'invalid-author' };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid postId format', () => {
      const invalidData = { ...validCommentData, postId: 'invalid-post' };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid parentId format', () => {
      const invalidData = { ...validCommentData, parentId: 'invalid-parent' };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative depth', () => {
      const invalidData = { ...validCommentData, depth: -1 };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject depth exceeding maximum', () => {
      const invalidData = { ...validCommentData, depth: 6 };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = { ...validCommentData, status: 'invalid' as any };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative counts', () => {
      const invalidData = { ...validCommentData, likeCount: -1 };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid childIds', () => {
      const invalidData = { ...validCommentData, childIds: ['invalid-id'] };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid path', () => {
      const invalidData = { ...validCommentData, path: ['invalid-id'] };
      const result = CommentMasterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept null parentId for top-level comments', () => {
      const validData = { ...validCommentData, parentId: null };
      const result = CommentMasterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept undefined parentId', () => {
      const { parentId, ...dataWithoutParentId } = validCommentData;
      const result = CommentMasterSchema.safeParse(dataWithoutParentId);
      expect(result.success).toBe(true);
    });

    it('should accept deleted comment with deletedAt', () => {
      const deletedData = {
        ...validCommentData,
        status: 'deleted' as const,
        isDeleted: true,
        deletedAt: new Date(),
      };
      const result = CommentMasterSchema.safeParse(deletedData);
      expect(result.success).toBe(true);
    });

    it('should accept comment with multiple mentions', () => {
      const dataWithMentions = {
        ...validCommentData,
        mentionedUserIds: [
          '507f1f77bcf86cd799439015',
          '507f1f77bcf86cd799439016',
        ],
      };
      const result = CommentMasterSchema.safeParse(dataWithMentions);
      expect(result.success).toBe(true);
    });

    it('should accept deep nested reply', () => {
      const deepReply = {
        ...validCommentData,
        depth: 5,
        path: [
          '507f1f77bcf86cd799439014',
          '507f1f77bcf86cd799439015',
          '507f1f77bcf86cd799439016',
          '507f1f77bcf86cd799439017',
          '507f1f77bcf86cd799439018',
          '507f1f77bcf86cd799439011',
        ],
      };
      const result = CommentMasterSchema.safeParse(deepReply);
      expect(result.success).toBe(true);
    });
  });
});
