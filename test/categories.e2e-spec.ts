import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/zod-exception.filter';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let createdCategoryId: string;

  const testCategory = {
    name: 'E2E Technology',
    slug: 'e2e-technology',
    description: 'E2E Technology related articles',
    color: '#FF5733',
    icon: '💻',
    order: 1,
    isActive: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 전역 필터 설정
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /categories', () => {
    it('새 카테고리를 생성해야 함', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send(testCategory)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', testCategory.name);
      expect(response.body).toHaveProperty('slug', testCategory.slug);
      expect(response.body).toHaveProperty(
        'description',
        testCategory.description,
      );
      expect(response.body).toHaveProperty('color', testCategory.color);
      expect(response.body).toHaveProperty('icon', testCategory.icon);
      expect(response.body).toHaveProperty('order', testCategory.order);
      expect(response.body).toHaveProperty('isActive', testCategory.isActive);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdCategoryId = response.body.id;
    });

    it('중복된 슬러그로 카테고리 생성 시 409 에러를 반환해야 함', async () => {
      const duplicateCategory = {
        ...testCategory,
        name: 'E2E Duplicate',
        slug: 'e2e-duplicate',
      };

      // 첫 번째 카테고리 생성
      await request(app.getHttpServer())
        .post('/categories')
        .send(duplicateCategory)
        .expect(201);

      // 같은 슬러그로 두 번째 카테고리 생성 시도
      await request(app.getHttpServer())
        .post('/categories')
        .send(duplicateCategory)
        .expect(409);
    });

    it('유효하지 않은 데이터로 카테고리 생성 시 400 에러를 반환해야 함', async () => {
      const invalidCategory = {
        ...testCategory,
        name: '', // 빈 이름
        color: 'invalid-color', // 유효하지 않은 색상
      };

      await request(app.getHttpServer())
        .post('/categories')
        .send(invalidCategory)
        .expect(400);
    });

    it('부모 카테고리를 지정하여 하위 카테고리를 생성해야 함', async () => {
      // 먼저 부모 카테고리 생성
      const parentCategory = {
        ...testCategory,
        name: 'E2E Parent',
        slug: 'e2e-parent',
      };

      const parentResponse = await request(app.getHttpServer())
        .post('/categories')
        .send(parentCategory)
        .expect(201);

      const childCategory = {
        name: 'E2E Frontend',
        slug: 'e2e-frontend',
        description: 'E2E Frontend development',
        color: '#00FF00',
        icon: '🎨',
        parentId: parentResponse.body.id,
        order: 1,
        isActive: true,
      };

      const childResponse = await request(app.getHttpServer())
        .post('/categories')
        .send(childCategory)
        .expect(201);

      expect(childResponse.body).toHaveProperty(
        'parentId',
        parentResponse.body.id,
      );
    });
  });

  describe('GET /categories', () => {
    it('모든 카테고리 목록을 반환해야 함', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('페이지네이션이 작동해야 함', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories?page=1&limit=10')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });
  });

  describe('GET /categories/tree', () => {
    it('카테고리 트리 구조를 반환해야 함', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/tree')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /categories/:id', () => {
    it('존재하지 않는 ID로 조회 시 404 에러를 반환해야 함', async () => {
      await request(app.getHttpServer())
        .get('/categories/507f1f77bcf86cd799439011')
        .expect(404);
    });

    it('유효하지 않은 ObjectId 형식으로 조회 시 400 에러를 반환해야 함', async () => {
      await request(app.getHttpServer())
        .get('/categories/invalid-id')
        .expect(400);
    });
  });
});
