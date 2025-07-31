import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/zod-exception.filter';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let createdUserId: string;

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

  describe('/users (POST)', () => {
    it('유효한 데이터로 사용자를 생성해야 함', () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Test@1234',
        name: 'Test User',
        role: 'user',
        isActive: true,
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('email', createUserDto.email);
          expect(response.body).toHaveProperty('name', createUserDto.name);
          expect(response.body).not.toHaveProperty('password'); // 비밀번호는 응답에 포함되지 않아야 함

          // 생성된 사용자 ID 저장 (다른 테스트에서 사용)
          createdUserId = response.body.id;
        });
    });

    it('유효하지 않은 이메일로 사용자 생성 시 400 에러가 발생해야 함', () => {
      const invalidUserDto = {
        email: 'invalid-email',
        password: 'Test@1234',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body.error).toHaveProperty(
            'message',
            'Validation failed',
          );
        });
    });

    it('약한 비밀번호로 사용자 생성 시 400 에러가 발생해야 함', () => {
      const invalidUserDto = {
        email: 'test2@example.com',
        password: '123456',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body.error).toHaveProperty(
            'message',
            'Validation failed',
          );
        });
    });

    it('중복된 이메일로 사용자 생성 시 409 에러가 발생해야 함', () => {
      const duplicateUserDto = {
        email: 'test@example.com', // 이미 생성된 이메일
        password: 'Test@1234',
        name: 'Duplicate User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(duplicateUserDto)
        .expect(409)
        .then((response) => {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body.error).toHaveProperty(
            'message',
            'Email already exists',
          );
        });
    });
  });

  describe('/users (GET)', () => {
    it('사용자 목록을 조회해야 함', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.meta).toHaveProperty('total');
          expect(response.body.meta).toHaveProperty('page');
          expect(response.body.meta).toHaveProperty('limit');
        });
    });

    it('페이지네이션과 함께 사용자 목록을 조회해야 함', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=5')
        .expect(200)
        .then((response) => {
          expect(response.body.meta).toHaveProperty('page', 1);
          expect(response.body.meta).toHaveProperty('limit', 5);
        });
    });

    it('이름으로 검색하여 사용자 목록을 조회해야 함', () => {
      return request(app.getHttpServer())
        .get('/users?name=Test')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          // 검색 결과에 'Test'가 포함된 사용자만 있어야 함
          if (response.body.data.length > 0) {
            expect(response.body.data[0].name).toContain('Test');
          }
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('ID로 특정 사용자를 조회해야 함', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', createdUserId);
          expect(response.body).toHaveProperty('email');
          expect(response.body).toHaveProperty('name');
          expect(response.body).not.toHaveProperty('password');
        });
    });

    it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 함', () => {
      const nonExistentId = '507f1f77bcf86cd799439999';

      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404)
        .then((response) => {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body.error).toHaveProperty('message');
        });
    });

    it('유효하지 않은 ObjectId 형식으로 조회 시 400 에러가 발생해야 함', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body.error).toHaveProperty(
            'message',
            'Validation failed',
          );
        });
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('사용자 정보를 수정해야 함', () => {
      const updateDto = {
        name: 'Updated Test User',
        bio: 'Updated bio',
      };

      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send(updateDto)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', createdUserId);
          expect(response.body).toHaveProperty('name', updateDto.name);
          expect(response.body).toHaveProperty('bio', updateDto.bio);
        });
    });

    it('존재하지 않는 사용자 수정 시 404 에러가 발생해야 함', () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      const updateDto = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('/users/:id/password (PATCH)', () => {
    it('존재하지 않는 사용자의 비밀번호 변경 시 404 에러가 발생해야 함', () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      const changePasswordDto = {
        currentPassword: 'Test@1234',
        newPassword: 'NewTest@1234',
      };

      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}/password`)
        .send(changePasswordDto)
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('사용자를 소프트 삭제해야 함', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(204);
    });

    it('이미 삭제된 사용자 삭제 시에도 204를 반환해야 함 (idempotent)', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(204);
    });

    it('존재하지 않는 사용자 삭제 시 404 에러가 발생해야 함', () => {
      const nonExistentId = '507f1f77bcf86cd799439999';

      return request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .expect(404);
    });
  });
});
