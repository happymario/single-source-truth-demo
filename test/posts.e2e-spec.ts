import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { PostsModule } from '../src/modules/posts/posts.module';
import { UsersModule } from '../src/modules/users/users.module';
import { CategoriesModule } from '../src/modules/categories/categories.module';
import { CommonModule } from '../src/common/common.module';
import { PostModel } from '../src/models/post.model';
import { UserModel } from '../src/models/user.model';
import { CategoryModel } from '../src/models/category.model';
import { CreatePostDto } from '../src/types/dto/post.dto.types';

describe('Posts E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let createdUserId: string;
  let createdCategoryId: string;
  let createdPostId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        CommonModule,
        UsersModule,
        CategoriesModule,
        PostsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    await app.init();

    // 테스트용 사용자 생성
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      })
      .expect(201);

    createdUserId = userResponse.body.user.id;

    // 테스트용 카테고리 생성
    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .send({
        name: 'Test Category',
        slug: 'test-category',
        color: '#FF0000',
      })
      .expect(201);

    createdCategoryId = categoryResponse.body.category.id;
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
    await app.close();
  });

  afterEach(async () => {
    // Posts만 정리 (User, Category는 유지)
    const postModel = mongoConnection.model(PostModel.name);
    await postModel.deleteMany({});
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'This is a test post content.',
        authorId: createdUserId,
        categoryIds: [createdCategoryId],
        tags: ['test', 'e2e'],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto)
        .expect(201);

      expect(response.body.message).toBe('게시물이 성공적으로 생성되었습니다.');
      expect(response.body.post).toBeDefined();
      expect(response.body.post.title).toBe(createPostDto.title);
      expect(response.body.post.slug).toBe(createPostDto.slug);
      expect(response.body.post.content).toBe(createPostDto.content);
      expect(response.body.post.authorId).toBe(createdUserId);
      expect(response.body.post.categoryIds).toContain(createdCategoryId);
      expect(response.body.post.id).toBeDefined();
      expect(response.body.post.createdAt).toBeDefined();
      expect(response.body.post.updatedAt).toBeDefined();

      createdPostId = response.body.post.id;
    });

    it('should reject invalid post data', async () => {
      const invalidDto = {
        title: '', // 빈 제목
        slug: 'test-post',
        content: 'Test content',
        authorId: createdUserId,
      };

      await request(app.getHttpServer())
        .post('/posts')
        .send(invalidDto)
        .expect(400);
    });

    it('should reject duplicate slug', async () => {
      const createPostDto: CreatePostDto = {
        title: 'First Post',
        slug: 'duplicate-slug',
        content: 'First post content',
        authorId: createdUserId,
        categoryIds: [],
        tags: [],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      // 첫 번째 게시물 생성
      await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto)
        .expect(201);

      // 중복 슬러그로 두 번째 게시물 생성 시도
      const duplicateDto = {
        ...createPostDto,
        title: 'Second Post',
      };

      await request(app.getHttpServer())
        .post('/posts')
        .send(duplicateDto)
        .expect(409);
    });

    it('should reject non-existent author', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        slug: 'test-post-nonexistent-author',
        content: 'Test content',
        authorId: '507f1f77bcf86cd799439999', // 존재하지 않는 사용자 ID
        categoryIds: [],
        tags: [],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto)
        .expect(404);
    });
  });

  describe('GET /posts', () => {
    beforeEach(async () => {
      // 몇 개의 테스트 게시물 생성
      const posts = [
        {
          title: 'First Post',
          slug: 'first-post',
          content: 'First post content',
          authorId: createdUserId,
          status: 'published',
          isPublic: true,
        },
        {
          title: 'Second Post',
          slug: 'second-post',
          content: 'Second post content',
          authorId: createdUserId,
          status: 'draft',
          isPublic: true,
        },
        {
          title: 'Third Post',
          slug: 'third-post',
          content: 'Third post content',
          authorId: createdUserId,
          status: 'published',
          isPublic: false,
        },
      ];

      for (const post of posts) {
        await request(app.getHttpServer()).post('/posts').send(post);
      }
    });

    it('should return paginated posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.posts).toBeDefined();
      expect(response.body.posts.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ status: 'published' })
        .expect(200);

      expect(response.body.posts).toBeDefined();
      response.body.posts.forEach((post: any) => {
        expect(post.status).toBe('published');
      });
    });

    it('should filter by author', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ authorId: createdUserId })
        .expect(200);

      expect(response.body.posts).toBeDefined();
      response.body.posts.forEach((post: any) => {
        expect(post.authorId).toBe(createdUserId);
      });
    });

    it('should sort posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.posts).toBeDefined();
      expect(response.body.posts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /posts/:id', () => {
    beforeEach(async () => {
      const createPostDto: CreatePostDto = {
        title: 'Single Post Test',
        slug: 'single-post-test',
        content: 'Single post content',
        authorId: createdUserId,
        categoryIds: [createdCategoryId],
        tags: ['single', 'test'],
        status: 'published',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto);

      createdPostId = response.body.post.id;
    });

    it('should return a single post by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/id/${createdPostId}`)
        .expect(200);

      expect(response.body.id).toBe(createdPostId);
      expect(response.body.title).toBe('Single Post Test');
    });

    it('should return a single post by slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/single-post-test')
        .expect(200);

      expect(response.body.id).toBe(createdPostId);
      expect(response.body.slug).toBe('single-post-test');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer())
        .get('/posts/id/507f1f77bcf86cd799439999')
        .expect(404);
    });

    it('should increment view count when requested', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/posts/id/${createdPostId}`)
        .query({ incrementView: true })
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/posts/id/${createdPostId}`)
        .query({ incrementView: true })
        .expect(200);

      expect(response2.body.viewCount).toBe(response1.body.viewCount + 1);
    });
  });

  describe('PATCH /posts/:id', () => {
    beforeEach(async () => {
      const createPostDto: CreatePostDto = {
        title: 'Update Test Post',
        slug: 'update-test-post',
        content: 'Original content',
        authorId: createdUserId,
        categoryIds: [],
        tags: ['update', 'test'],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto);

      createdPostId = response.body.post.id;
    });

    it('should update a post', async () => {
      const updateDto = {
        title: 'Updated Post Title',
        content: 'Updated content',
        tags: ['updated', 'test'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/posts/${createdPostId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.message).toBe('게시물이 성공적으로 수정되었습니다.');
      expect(response.body.post.title).toBe(updateDto.title);
      expect(response.body.post.content).toBe(updateDto.content);
      expect(response.body.post.tags).toEqual(updateDto.tags);
    });

    it('should return 404 for non-existent post', async () => {
      const updateDto = { title: 'Updated Title' };

      await request(app.getHttpServer())
        .patch('/posts/507f1f77bcf86cd799439999')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('PATCH /posts/:id/status', () => {
    beforeEach(async () => {
      const createPostDto: CreatePostDto = {
        title: 'Status Test Post',
        slug: 'status-test-post',
        content: 'Status test content',
        authorId: createdUserId,
        categoryIds: [],
        tags: [],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto);

      createdPostId = response.body.post.id;
    });

    it('should change post status to published', async () => {
      const statusDto = { status: 'published' };

      const response = await request(app.getHttpServer())
        .patch(`/posts/${createdPostId}/status`)
        .send(statusDto)
        .expect(200);

      expect(response.body.message).toBe('게시물 상태가 성공적으로 변경되었습니다.');
      expect(response.body.post.status).toBe('published');
      expect(response.body.post.publishedAt).toBeDefined();
    });
  });

  describe('DELETE /posts/:id', () => {
    beforeEach(async () => {
      const createPostDto: CreatePostDto = {
        title: 'Delete Test Post',
        slug: 'delete-test-post',
        content: 'Delete test content',
        authorId: createdUserId,
        categoryIds: [],
        tags: [],
        status: 'draft',
        isPublic: true,
        allowComments: true,
        isFeatured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto);

      createdPostId = response.body.post.id;
    });

    it('should delete a post', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${createdPostId}`)
        .expect(200);

      expect(response.body.message).toBe('게시물이 성공적으로 삭제되었습니다.');
      expect(response.body.deletedId).toBe(createdPostId);

      // 삭제된 게시물 조회 시 404 반환 확인
      await request(app.getHttpServer())
        .get(`/posts/id/${createdPostId}`)
        .expect(404);
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer())
        .delete('/posts/507f1f77bcf86cd799439999')
        .expect(404);
    });
  });

  describe('GET /posts/stats', () => {
    beforeEach(async () => {
      // 통계용 테스트 게시물들 생성
      const posts = [
        {
          title: 'Published Post 1',
          slug: 'published-post-1',
          content: 'Content 1',
          authorId: createdUserId,
          status: 'published',
          viewCount: 10,
          likeCount: 5,
        },
        {
          title: 'Published Post 2',
          slug: 'published-post-2',
          content: 'Content 2',
          authorId: createdUserId,
          status: 'published',
          viewCount: 20,
          likeCount: 8,
        },
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'Draft content',
          authorId: createdUserId,
          status: 'draft',
        },
      ];

      for (const post of posts) {
        await request(app.getHttpServer()).post('/posts').send(post);
      }
    });

    it('should return post statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/stats')
        .expect(200);

      expect(response.body.totalPosts).toBeGreaterThanOrEqual(3);
      expect(response.body.publishedPosts).toBeGreaterThanOrEqual(2);
      expect(response.body.draftPosts).toBeGreaterThanOrEqual(1);
      expect(response.body.totalViews).toBeGreaterThanOrEqual(30);
      expect(response.body.totalLikes).toBeGreaterThanOrEqual(13);
      expect(response.body.averageViewsPerPost).toBeGreaterThan(0);
      expect(response.body.averageLikesPerPost).toBeGreaterThan(0);
    });
  });

  describe('GET /posts/popular', () => {
    beforeEach(async () => {
      // 인기 게시물용 테스트 데이터 생성
      const posts = [
        {
          title: 'Popular Post 1',
          slug: 'popular-post-1',
          content: 'Popular content 1',
          authorId: createdUserId,
          status: 'published',
          isPublic: true,
          viewCount: 100,
          likeCount: 50,
        },
        {
          title: 'Popular Post 2',
          slug: 'popular-post-2',
          content: 'Popular content 2',
          authorId: createdUserId,
          status: 'published',
          isPublic: true,
          viewCount: 200,
          likeCount: 30,
        },
      ];

      for (const post of posts) {
        await request(app.getHttpServer()).post('/posts').send(post);
      }
    });

    it('should return popular posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/popular')
        .query({ limit: 5 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(5);

      // 조회수 순으로 정렬되어 있는지 확인
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i].viewCount).toBeLessThanOrEqual(
          response.body[i - 1].viewCount,
        );
      }
    });
  });
});