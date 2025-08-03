import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';
import { CommentsService } from './comments.service';
import { CommentModel, CommentSchema } from '../../models/comment.model';
import { UserModel, UserSchema } from '../../models/user.model';
import { PostModel, PostSchema } from '../../models/post.model';
import { CommentMapper } from '../../common/mappers/comment.mapper';

describe.skip('CommentsService - 계층 구조 통합 테스트', () => {
  let service: CommentsService;
  // let mongod: MongoMemoryServer;
  let connection: Connection;

  // 테스트 데이터
  const testUser = {
    name: '테스트 사용자',
    email: 'test@example.com',
    role: 'user' as const,
    avatar: 'https://example.com/avatar.jpg',
  };

  const testPost = {
    title: '테스트 게시물',
    content: '테스트 내용',
    status: 'published' as const,
    slug: 'test-post',
    excerpt: '테스트 요약',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: CommentModel.name, schema: CommentSchema },
          { name: UserModel.name, schema: UserSchema },
          { name: PostModel.name, schema: PostSchema },
        ]),
      ],
      providers: [CommentsService],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    connection = mongoose.connection;
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    // 각 테스트 후 컬렉션 정리
    const collections = connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('계층 구조 댓글 생성', () => {
    it('루트 댓글을 생성할 수 있어야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 루트 댓글 생성
      const createCommentDto = {
        content: '이것은 루트 댓글입니다.',
        postId: post.id,
      };

      const result = await service.create(createCommentDto, user.id);

      expect(result).toBeDefined();
      expect(result.content).toBe(createCommentDto.content);
      expect(result.depth).toBe(0);
      expect(result.parentId).toBeNull();
      expect(result.path).toEqual([]);
      expect(result.author.name).toBe(testUser.name);
    });

    it('답글을 생성할 수 있어야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');
      const commentModel = connection.model('CommentModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 루트 댓글 생성
      const rootComment = await commentModel.create({
        content: '부모 댓글',
        authorId: user.id,
        postId: post.id,
        depth: 0,
        path: [],
        childIds: [],
      });

      // 답글 생성
      const createReplyDto = {
        content: '이것은 답글입니다.',
        postId: post.id,
        parentId: rootComment.id,
      };

      const result = await service.create(createReplyDto, user.id);

      expect(result).toBeDefined();
      expect(result.content).toBe(createReplyDto.content);
      expect(result.depth).toBe(1);
      expect(result.parentId).toBe(rootComment.id);
      expect(result.path).toEqual([rootComment.id]);

      // 부모 댓글의 childIds가 업데이트되었는지 확인
      const updatedRootComment = await commentModel.findById(rootComment.id);
      expect(updatedRootComment.childIds).toContain(result.id);
    });

    it('최대 깊이 5를 초과하면 에러를 발생시켜야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');
      const commentModel = connection.model('CommentModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 깊이 5의 댓글 생성
      const level5Comment = await commentModel.create({
        content: '깊이 5 댓글',
        authorId: user.id,
        postId: post.id,
        depth: 5,
        path: ['level0', 'level1', 'level2', 'level3'], // 4개 경로
        childIds: [],
      });

      // 깊이 6 댓글 생성 시도
      const createDeepReplyDto = {
        content: '너무 깊은 답글',
        postId: post.id,
        parentId: level5Comment.id,
      };

      await expect(service.create(createDeepReplyDto, user.id)).rejects.toThrow(
        'Maximum comment depth exceeded',
      );
    });
  });

  describe('계층 구조 댓글 조회', () => {
    it('트리 구조로 댓글을 조회할 수 있어야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');
      const commentModel = connection.model('CommentModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 계층 구조 댓글 생성
      const rootComment = await commentModel.create({
        content: '루트 댓글',
        authorId: user.id,
        postId: post.id,
        depth: 0,
        path: [],
        childIds: [],
      });

      const childComment1 = await commentModel.create({
        content: '첫 번째 답글',
        authorId: user.id,
        postId: post.id,
        parentId: rootComment.id,
        depth: 1,
        path: [rootComment.id],
        childIds: [],
      });

      const childComment2 = await commentModel.create({
        content: '두 번째 답글',
        authorId: user.id,
        postId: post.id,
        parentId: rootComment.id,
        depth: 1,
        path: [rootComment.id],
        childIds: [],
      });

      // 부모 댓글의 childIds 업데이트
      await commentModel.findByIdAndUpdate(rootComment.id, {
        childIds: [childComment1.id, childComment2.id],
      });

      const result = await service.findTreeByPost(post.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('루트 댓글');
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].content).toBe('첫 번째 답글');
      expect(result[0].children[1].content).toBe('두 번째 답글');
    });

    it('스레드 구조로 댓글을 조회할 수 있어야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');
      const commentModel = connection.model('CommentModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 계층 구조 댓글 생성 (순서 뒤섞어서)
      const childComment = await commentModel.create({
        content: '답글 - 깊이 1',
        authorId: user.id,
        postId: post.id,
        depth: 1,
        path: ['root-id'],
        childIds: [],
      });

      const rootComment = await commentModel.create({
        content: '루트 댓글 - 깊이 0',
        authorId: user.id,
        postId: post.id,
        depth: 0,
        path: [],
        childIds: [childComment.id],
      });

      const grandChildComment = await commentModel.create({
        content: '대답글 - 깊이 2',
        authorId: user.id,
        postId: post.id,
        depth: 2,
        path: [rootComment.id, childComment.id],
        childIds: [],
      });

      const result = await service.findThreadByPost(post.id, {});

      expect(result).toHaveLength(3);

      // 깊이 순으로 정렬되어야 함
      expect(result[0].depth).toBe(0);
      expect(result[0].content).toBe('루트 댓글 - 깊이 0');

      expect(result[1].depth).toBe(1);
      expect(result[1].content).toBe('답글 - 깊이 1');

      expect(result[2].depth).toBe(2);
      expect(result[2].content).toBe('대답글 - 깊이 2');
    });

    it('페이징된 댓글 목록을 조회할 수 있어야 한다', async () => {
      // 사용자와 게시물 생성
      const userModel = connection.model('UserModel');
      const postModel = connection.model('PostModel');
      const commentModel = connection.model('CommentModel');

      const user = await userModel.create(testUser);
      const post = await postModel.create({
        ...testPost,
        authorId: user.id,
        categoryIds: [],
      });

      // 여러 댓글 생성
      for (let i = 1; i <= 5; i++) {
        await commentModel.create({
          content: `댓글 ${i}`,
          authorId: user.id,
          postId: post.id,
          depth: 0,
          path: [],
          childIds: [],
        });
      }

      const result = await service.findByPost(post.id, {
        page: 1,
        limit: 3,
      });

      expect(result.comments).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('CommentMapper 유틸리티 메서드', () => {
    it('댓글 경로를 올바르게 생성해야 한다', () => {
      const parentPath = ['level0', 'level1'];
      const parentId = 'level2';

      const mockParent = {
        path: parentPath,
        id: parentId,
      } as any;

      const result = CommentMapper.buildCommentPath(mockParent);

      expect(result).toEqual(['level0', 'level1', 'level2']);
    });

    it('댓글 깊이를 올바르게 계산해야 한다', () => {
      const mockParent = {
        depth: 2,
      } as any;

      const result = CommentMapper.calculateDepth(mockParent);

      expect(result).toBe(3);
    });

    it('최대 깊이를 초과하지 않아야 한다', () => {
      const mockParent = {
        depth: 5,
      } as any;

      const result = CommentMapper.calculateDepth(mockParent);

      expect(result).toBe(5); // 최대 깊이 5 유지
    });

    it('댓글 편집 가능 여부를 올바르게 판단해야 한다', () => {
      const authorId = 'user123';
      const mockComment = {
        authorId,
        isDeleted: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10분 전
      } as any;

      const result = CommentMapper.isCommentEditable(
        mockComment,
        authorId,
        1000 * 60 * 60, // 1시간 제한
      );

      expect(result).toBe(true);
    });

    it('시간 제한을 초과한 댓글은 편집할 수 없어야 한다', () => {
      const authorId = 'user123';
      const mockComment = {
        authorId,
        isDeleted: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25시간 전
      } as any;

      const result = CommentMapper.isCommentEditable(
        mockComment,
        authorId,
        1000 * 60 * 60 * 24, // 24시간 제한
      );

      expect(result).toBe(false);
    });
  });
});
