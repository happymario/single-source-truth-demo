import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentModel, CommentDocument } from '../../models/comment.model';
import { UserModel, UserDocument } from '../../models/user.model';
import { PostModel, PostDocument } from '../../models/post.model';

describe('CommentsService - 계층 구조 테스트', () => {
  let service: CommentsService;
  let commentModel: Model<CommentDocument>;
  let userModel: Model<UserDocument>;
  let postModel: Model<PostDocument>;

  // 테스트 데이터
  const mockUser = {
    _id: new Types.ObjectId(),
    id: new Types.ObjectId().toHexString(),
    name: '테스트 사용자',
    email: 'test@example.com',
    role: 'user' as const,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    toJSON: () => ({
      id: new Types.ObjectId().toHexString(),
      name: '테스트 사용자',
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    }),
  };

  const mockPost = {
    _id: new Types.ObjectId(),
    id: new Types.ObjectId().toHexString(),
    title: '테스트 게시물',
    content: '테스트 내용',
    authorId: mockUser.id,
    toJSON: () => ({
      id: new Types.ObjectId().toHexString(),
      title: '테스트 게시물',
      content: '테스트 내용',
      authorId: mockUser.id,
    }),
  };

  // 계층 구조 댓글 데이터
  const createMockComment = (
    content: string,
    parentId: string | null = null,
    depth = 0,
    path: string[] = [],
    childIds: string[] = [],
  ) => {
    const id = new Types.ObjectId().toHexString();
    const mockComment = {
      _id: new Types.ObjectId(),
      id,
      content,
      authorId: mockUser.id,
      postId: mockPost.id,
      parentId,
      depth,
      path: path
        .filter((p) => p)
        .map((p) =>
          Types.ObjectId.isValid(p) ? p : new Types.ObjectId().toHexString(),
        ),
      childIds: childIds
        .filter((c) => c)
        .map((c) =>
          Types.ObjectId.isValid(c) ? c : new Types.ObjectId().toHexString(),
        ),
      status: 'active' as const,
      likeCount: 0,
      reportCount: 0,
      isEdited: false,
      isDeleted: false,
      deletedAt: null,
      mentionedUserIds: [],
      metadata: { editHistory: [] },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      save: jest.fn(),
      toJSON: function () {
        return {
          id: this.id,
          content: this.content,
          authorId: this.authorId,
          postId: this.postId,
          parentId: this.parentId,
          depth: this.depth,
          path: this.path,
          childIds: this.childIds,
          status: this.status,
          likeCount: this.likeCount,
          reportCount: this.reportCount,
          isEdited: this.isEdited,
          isDeleted: this.isDeleted,
          deletedAt: this.deletedAt,
          mentionedUserIds: this.mentionedUserIds,
          metadata: this.metadata,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      },
    };
    // save 메서드가 mockComment 자신을 반환하도록 설정
    mockComment.save = jest.fn().mockResolvedValue(mockComment);
    return mockComment;
  };

  beforeEach(async () => {
    const mockCommentModel = jest.fn().mockImplementation((data) => {
      const id = new Types.ObjectId().toHexString();
      const instance = {
        ...data,
        _id: new Types.ObjectId(),
        id,
        save: jest.fn().mockResolvedValue({
          ...data,
          id,
          toJSON: function () {
            return { ...this };
          },
        }),
        toJSON: function () {
          return {
            id: this.id,
            content: this.content,
            authorId: this.authorId,
            postId: this.postId,
            parentId: this.parentId,
            depth: this.depth,
            path: this.path || [],
            childIds: this.childIds || [],
            status: this.status || 'active',
            likeCount: this.likeCount || 0,
            reportCount: this.reportCount || 0,
            isEdited: this.isEdited || false,
            isDeleted: this.isDeleted || false,
            deletedAt: this.deletedAt || null,
            mentionedUserIds: this.mentionedUserIds || [],
            metadata: this.metadata || { editHistory: [] },
            createdAt: this.createdAt || new Date('2023-01-01'),
            updatedAt: this.updatedAt || new Date('2023-01-01'),
          };
        },
      };
      return instance;
    });

    // 정적 메서드들 추가
    Object.assign(mockCommentModel, {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      exec: jest.fn(),
    });

    const mockUserModel = {
      findById: jest.fn(),
    };

    const mockPostModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getModelToken(CommentModel.name),
          useValue: mockCommentModel,
        },
        {
          provide: getModelToken(UserModel.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(PostModel.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentModel = module.get<Model<CommentDocument>>(
      getModelToken(CommentModel.name),
    );
    userModel = module.get<Model<UserDocument>>(getModelToken(UserModel.name));
    postModel = module.get<Model<PostDocument>>(getModelToken(PostModel.name));
  });

  describe('계층 구조 댓글 생성', () => {
    it('루트 댓글을 생성할 수 있어야 한다', async () => {
      const createCommentDto = {
        content: '루트 댓글입니다',
        postId: mockPost.id,
      };

      const mockComment = createMockComment(createCommentDto.content);

      (postModel.findById as jest.Mock).mockResolvedValue(mockPost);
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createCommentDto, mockUser.id);

      expect(result).toBeDefined();
      expect(result.content).toBe(createCommentDto.content);
      expect(result.author).toBeDefined();
      expect(result.author.name).toBe(mockUser.name);
    });

    it('답글을 생성할 수 있어야 한다', async () => {
      const parentComment = createMockComment('부모 댓글', null, 0, []);
      const createCommentDto = {
        content: '답글입니다',
        postId: mockPost.id,
        parentId: parentComment.id,
      };

      const expectedChildComment = createMockComment(
        createCommentDto.content,
        parentComment.id,
        1,
        [parentComment.id],
      );

      (postModel.findById as jest.Mock).mockResolvedValue(mockPost);
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (commentModel.findById as jest.Mock).mockResolvedValue(parentComment);
      (commentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        parentComment,
      );

      const result = await service.create(createCommentDto, mockUser.id);

      expect(result).toBeDefined();
      expect(result.content).toBe(createCommentDto.content);

      // 부모 댓글의 childIds 업데이트 확인
      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        parentComment.id,
        { $push: { childIds: expectedChildComment.id } },
      );
    });

    it('최대 깊이 5를 초과하면 에러를 발생시켜야 한다', async () => {
      const parentComment = createMockComment('깊이 5 댓글', null, 5, []);
      const createCommentDto = {
        content: '깊이 6 댓글 시도',
        postId: mockPost.id,
        parentId: parentComment.id,
      };

      (postModel.findById as jest.Mock).mockResolvedValue(mockPost);
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (commentModel.findById as jest.Mock).mockResolvedValue(parentComment);

      await expect(
        service.create(createCommentDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('다른 게시물의 댓글에 답글을 달려고 하면 에러를 발생시켜야 한다', async () => {
      const otherPostId = new Types.ObjectId().toHexString();
      const parentComment = createMockComment('다른 게시물 댓글', null, 0, []);
      parentComment.postId = otherPostId;

      const createCommentDto = {
        content: '잘못된 답글',
        postId: mockPost.id,
        parentId: parentComment.id,
      };

      (postModel.findById as jest.Mock).mockResolvedValue(mockPost);
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (commentModel.findById as jest.Mock).mockResolvedValue(parentComment);

      await expect(
        service.create(createCommentDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('계층 구조 댓글 조회', () => {
    it('트리 구조로 댓글을 조회할 수 있어야 한다', async () => {
      // 계층 구조 댓글 데이터 생성
      const child1Id = new Types.ObjectId().toHexString();
      const child2Id = new Types.ObjectId().toHexString();
      const grandChild1Id = new Types.ObjectId().toHexString();

      const rootComment1 = createMockComment(
        '루트 댓글 1',
        null,
        0,
        [],
        [child1Id, child2Id],
      );
      const rootComment2 = createMockComment('루트 댓글 2', null, 0, [], []);
      const childComment1 = createMockComment(
        '답글 1',
        rootComment1.id,
        1,
        [rootComment1.id],
        [grandChild1Id],
      );
      const childComment2 = createMockComment(
        '답글 2',
        rootComment1.id,
        1,
        [rootComment1.id],
        [],
      );
      const grandChildComment1 = createMockComment(
        '대답글 1',
        childComment1.id,
        2,
        [rootComment1.id, childComment1.id],
        [],
      );

      // ID를 올바르게 설정
      childComment1.id = child1Id;
      childComment2.id = child2Id;
      grandChildComment1.id = grandChild1Id;

      const mockComments = [
        rootComment1,
        rootComment2,
        childComment1,
        childComment2,
        grandChildComment1,
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.findTreeByPost(mockPost.id, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(commentModel.find).toHaveBeenCalledWith({
        postId: mockPost.id,
        isDeleted: false,
      });
    });

    it('스레드 구조로 댓글을 조회할 수 있어야 한다', async () => {
      const rootId = new Types.ObjectId().toHexString();
      const childId = new Types.ObjectId().toHexString();

      const mockComments = [
        createMockComment('루트 댓글', null, 0, []),
        createMockComment('답글', rootId, 1, [rootId]),
        createMockComment('대답글', childId, 2, [rootId, childId]),
      ];

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.findThreadByPost(mockPost.id, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(commentModel.find).toHaveBeenCalledWith({
        postId: mockPost.id,
        isDeleted: false,
      });
    });

    it('작성자 정보를 포함해서 조회할 수 있어야 한다', async () => {
      const mockComments = [createMockComment('테스트 댓글')];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);

      await service.findTreeByPost(mockPost.id, { includeAuthor: true });

      expect(mockQuery.populate).toHaveBeenCalledWith('authorId');
    });
  });

  describe('댓글 목록 조회 (페이징)', () => {
    it('페이징된 댓글 목록을 조회할 수 있어야 한다', async () => {
      const mockComments = [
        createMockComment('댓글 1'),
        createMockComment('댓글 2'),
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);
      (commentModel.countDocuments as jest.Mock).mockResolvedValue(10);

      const result = await service.findByPost(mockPost.id, {
        page: 1,
        limit: 2,
      });

      expect(result).toBeDefined();
      expect(result.comments).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('부모 댓글만 조회할 수 있어야 한다', async () => {
      const mockComments = [createMockComment('루트 댓글')];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);
      (commentModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await service.findByPost(mockPost.id, {
        parentId: 'null',
      });

      expect(commentModel.find).toHaveBeenCalledWith({
        postId: mockPost.id,
        isDeleted: false,
        parentId: null,
      });
    });

    it('특정 부모의 답글만 조회할 수 있어야 한다', async () => {
      const parentId = new Types.ObjectId().toHexString();
      const mockComments = [createMockComment('답글', parentId)];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      };

      (commentModel.find as jest.Mock).mockReturnValue(mockQuery);
      (commentModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await service.findByPost(mockPost.id, {
        parentId,
      });

      expect(commentModel.find).toHaveBeenCalledWith({
        postId: mockPost.id,
        isDeleted: false,
        parentId,
      });
    });
  });

  describe('댓글 수정 및 삭제', () => {
    it('댓글을 수정할 수 있어야 한다', async () => {
      const mockComment = createMockComment('원본 댓글');
      // 최근에 생성된 댓글로 설정하여 편집 가능하도록 함
      mockComment.createdAt = new Date();
      const updateDto = { content: '수정된 댓글' };

      (commentModel.findById as jest.Mock).mockResolvedValue(mockComment);
      (commentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockComment,
        content: updateDto.content,
        isEdited: true,
      });
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.update(
        mockComment.id,
        updateDto,
        mockUser.id,
      );

      expect(result).toBeDefined();
      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockComment.id,
        expect.objectContaining({
          content: updateDto.content,
          isEdited: true,
        }),
        { new: true },
      );
    });

    it('다른 사용자의 댓글은 수정할 수 없어야 한다', async () => {
      const mockComment = createMockComment('다른 사용자 댓글');
      mockComment.authorId = new Types.ObjectId().toHexString();
      const updateDto = { content: '수정 시도' };

      (commentModel.findById as jest.Mock).mockResolvedValue(mockComment);

      await expect(
        service.update(mockComment.id, updateDto, mockUser.id),
      ).rejects.toThrow('You can only edit your own comments');
    });

    it('댓글을 소프트 삭제할 수 있어야 한다', async () => {
      const mockComment = createMockComment('삭제할 댓글');

      (commentModel.findById as jest.Mock).mockResolvedValue(mockComment);
      (commentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockComment,
        isDeleted: true,
        content: '[삭제된 댓글입니다]',
      });

      const result = await service.remove(mockComment.id, mockUser.id);

      expect(result).toBeDefined();
      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockComment.id,
        expect.objectContaining({
          isDeleted: true,
          content: '[삭제된 댓글입니다]',
        }),
        { new: true },
      );
    });
  });

  describe('댓글 좋아요 및 신고', () => {
    it('댓글에 좋아요를 할 수 있어야 한다', async () => {
      const mockComment = createMockComment('좋아요 테스트');

      (commentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockComment,
        likeCount: 1,
      });

      const result = await service.like(mockComment.id);

      expect(result).toBeDefined();
      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockComment.id,
        { $inc: { likeCount: 1 } },
        { new: true },
      );
    });

    it('댓글을 신고할 수 있어야 한다', async () => {
      const mockComment = createMockComment('신고 테스트');

      (commentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockComment,
        reportCount: 1,
      });

      const result = await service.report(mockComment.id);

      expect(result).toBeDefined();
      expect(commentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockComment.id,
        { $inc: { reportCount: 1 } },
        { new: true },
      );
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 댓글 조회 시 NotFoundException을 발생시켜야 한다', async () => {
      const nonExistentId = new Types.ObjectId().toHexString();

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (commentModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('잘못된 ObjectId 형식 시 BadRequestException을 발생시켜야 한다', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('존재하지 않는 게시물에 댓글 작성 시 NotFoundException을 발생시켜야 한다', async () => {
      const createCommentDto = {
        content: '댓글 내용',
        postId: new Types.ObjectId().toHexString(),
      };

      (postModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(createCommentDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 부모 댓글에 답글 작성 시 NotFoundException을 발생시켜야 한다', async () => {
      const createCommentDto = {
        content: '답글 내용',
        postId: mockPost.id,
        parentId: new Types.ObjectId().toHexString(),
      };

      (postModel.findById as jest.Mock).mockResolvedValue(mockPost);
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (commentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(createCommentDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
