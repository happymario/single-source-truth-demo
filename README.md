# NestJS Zod-Centric Single Source of Truth Architecture

## 개요

이 프로젝트는 NestJS에서 Zod 스키마를 중심으로 하는 Single Source of Truth 아키텍처를 구현한 예제입니다. 모든 타입 정의가 Zod 스키마에서 파생되며, 타입 안정성과 런타임 검증을 동시에 제공합니다.

## 핵심 원칙

### 1. Single Source of Truth
- 모든 타입은 Zod 스키마에서 `z.infer<typeof Schema>`로 추론
- 별도의 interface/type 정의 금지
- Master 스키마가 유일한 진실의 원천

### 2. No "any" Type
- `any` 타입 사용 엄격히 금지
- 타입이 불명확한 경우 `unknown` 사용 후 Zod 파싱

### 3. 스키마 기반 검증
- 모든 입력값은 Zod 스키마로 검증
- validator 라이브러리 우선 사용
- 커스텀 검증은 최소화

## 아키텍처 구조

```
src/
├── schemas/          # Zod 스키마 (Single Source of Truth)
│   ├── master/      # 마스터 스키마 - 모든 타입의 원천
│   ├── dto/         # 파생 DTO 스키마 (.omit, .partial)
│   ├── query/       # 쿼리 파라미터 스키마
│   ├── response/    # API 응답 스키마
│   └── shared/      # 공통 스키마 (timestamps, objectId 등)
├── types/           # 타입 추론만 (z.infer)
├── models/          # Mongoose 모델 (Zod 타입 구현)
├── common/          # 공통 유틸리티
│   ├── decorators/  # @ZodBody, @ZodQuery, @ZodParam
│   ├── pipes/       # ZodValidationPipe
│   ├── filters/     # ZodExceptionFilter
│   └── mappers/     # 타입 안전 엔티티 매퍼
└── modules/         # 기능 모듈
```

## 시작하기

### 1. 의존성 설치

```bash
npm install zod mongoose @nestjs/mongoose validator
npm install -D @types/validator
```

### 2. TypeScript 설정

`tsconfig.json`에 다음 설정 추가:

```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strictNullChecks": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. 핵심 파일 복사

다음 파일들을 프로젝트에 복사:

#### Common 모듈
- `src/common/decorators/` - Zod 검증 데코레이터
- `src/common/pipes/zod-validation.pipe.ts` - 검증 파이프
- `src/common/filters/zod-exception.filter.ts` - 예외 필터
- `src/common/utils/` - OpenAPI 유틸리티

#### Base Model
- `src/models/base.model.ts` - MongoDB ObjectId 변환 처리

#### 공통 스키마
- `src/schemas/shared/` - 재사용 가능한 스키마

## 구현 패턴

### 1. 마스터 스키마 정의

```typescript
// src/schemas/master/user.schema.ts
import { z } from 'zod';
import validator from 'validator';
import { ObjectIdSchema, TimestampsSchema } from '../shared/common.schema';

export const UserMasterSchema = z.object({
  id: ObjectIdSchema,
  email: z.string().refine(validator.isEmail, 'Invalid email'),
  name: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters'
  ),
  password: z.string().min(8),
}).merge(TimestampsSchema);
```

### 2. DTO 스키마 파생

```typescript
// src/schemas/dto/user.dto.schema.ts
import { UserMasterSchema } from '../master/user.schema';

export const CreateUserSchema = UserMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateUserSchema = CreateUserSchema.partial();
```

### 3. 타입 추론

```typescript
// src/types/entities/user.types.ts
import { z } from 'zod';
import { UserMasterSchema } from '@/schemas/master/user.schema';

export type User = z.infer<typeof UserMasterSchema>;
```

### 4. Mongoose 모델

```typescript
// src/models/user.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseModel } from './base.model';
import { User } from '@/types/entities/user.types';

@Schema({
  collection: 'users',
  versionKey: false,
  timestamps: true
})
export class UserModel extends BaseModel implements User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
```

### 5. Controller 구현

```typescript
// src/modules/users/users.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ZodBody, ZodParam } from '@/common/decorators';
import { CreateUserSchema } from '@/schemas/dto/user.dto.schema';
import { ObjectIdSchema } from '@/schemas/shared/common.schema';
import { CreateUserDto } from '@/types/dto/user.dto.types';

@Controller('users')
export class UsersController {
  @Post()
  create(@ZodBody(CreateUserSchema) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  findOne(@ZodParam('id', ObjectIdSchema) id: string) {
    return this.usersService.findOne(id);
  }
}
```

## 검증 규칙

### 각 엔티티 구현 시 체크리스트

- [ ] 마스터 스키마가 validator 라이브러리 사용
- [ ] 모든 DTO가 마스터에서 파생 (omit/partial)
- [ ] 타입이 z.infer만 사용 (수동 정의 없음)
- [ ] Mongoose 모델이 Zod 타입 정확히 구현
- [ ] versionKey: false 설정
- [ ] BaseModel 상속으로 ID 변환 처리
- [ ] `any` 타입 없음
- [ ] 린트/빌드/테스트 통과

## 품질 관리

### 커밋 전 필수 실행

```bash
npm run lint        # 린트 검사
npm run type-check  # 타입 검사
npm run build       # 빌드 검증
npm run test        # 단위 테스트
npm run test:e2e    # E2E 테스트
```

## 일반적인 함정

1. **ObjectId 처리**: Zod는 string, Mongoose는 \_id 사용 - BaseModel이 자동 변환
2. **Timestamps**: 마스터 스키마에 포함, Create DTO에서 제외
3. **Relations**: 임베디드 문서 대신 ObjectId 참조 사용
4. **Validation**: 커스텀 정규식보다 validator 라이브러리 선호
5. **Response DTOs**: 민감한 필드(비밀번호 등) 제외 필수

## 새 엔티티 추가 가이드

1. `/schemas/master/entity.schema.ts` - 마스터 스키마 생성
2. `/schemas/dto/entity.dto.schema.ts` - DTO 스키마 파생
3. `/types/entities/entity.types.ts` - 타입 추론
4. `/models/entity.model.ts` - Mongoose 모델 생성
5. `/common/mappers/entity.mapper.ts` - 매퍼 생성
6. `/modules/entity/` - 서비스와 컨트롤러 구현

## 예제 프로젝트 구조

이 아키텍처는 다음 엔티티들로 시연됩니다:
- **User**: 인증 기본 엔티티
- **Category**: 단순 참조 엔티티
- **Post**: User(작성자)와 Categories 참조
- **Comment**: User, Post, 자기 참조(부모 댓글)

## 라이선스

MIT