# Zod 중심 데이터 관리 아키텍처 검증 데모 PRD

## 프로젝트 개요

### 목적
NestJS + MongoDB + Zod를 활용한 중앙집중식 스키마 관리 아키텍처의 실현 가능성과 효과를 검증

### 핵심 검증 목표
- **타입 안전성**: zod 스키마 → TypeScript 타입 → Mongoose 모델 간의 일관성
- **개발 효율성**: Single Source of Truth로 인한 코드 중복 제거 효과
- **유지보수성**: 스키마 변경 시 전체 시스템에 미치는 영향과 대응 방안
- **확장성**: 새로운 엔티티 추가 시 기존 패턴의 재사용 가능성

---

## 🔥 핵심 원칙 (절대 준수 사항)

### 1️⃣ Single Source of Truth 원칙 (최우선)
```typescript
// ✅ 올바른 패턴: zod 스키마가 유일한 원본
export const UserMasterSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// ✅ 모든 타입은 zod 스키마에서 추론
export type User = z.infer<typeof UserMasterSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ❌ 금지: 별도의 interface/type 정의
interface User {  // 절대 금지!
  id: string;
  email: string;
  name: string;
}

// ❌ 금지: 중복된 타입 정의
type CreateUserDto = {  // 절대 금지!
  email: string;
  name: string;
}
```

### 2️⃣ any 사용 금지 원칙 (두 번째 우선순위)
```typescript
// ✅ 올바른 패턴: 명확한 타입 지정
export const processUser = (user: User): UserResponse => {
  return UserMapper.toResponse(user);
};

// ❌ 금지: 프로덕션 코드에서 any 사용
export const processUser = (user: any): any => {  // 절대 금지!
  return user;
};

// ✅ 불가피한 경우: unknown 사용 후 타입 가드
export const processUnknownData = (data: unknown): User => {
  return UserMasterSchema.parse(data);  // zod로 검증 후 타입 확정
};

// ✅ 허용: 테스트 코드에서만 any 사용 (Mock 객체, 타입 단언 등)
describe('UserService', () => {
  it('should create user', () => {
    const mockUser = { id: '123', email: 'test@example.com' } as any; // 테스트에서 허용
    const result = userService.create(mockUser);
    expect(result).toBeDefined();
  });
});
```

### 3️⃣ zod 스키마 파생 규칙
```typescript
// ✅ 모든 DTO는 마스터 스키마에서 파생
export const CreateUserSchema = UserMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateUserSchema = UserMasterSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

// ❌ 금지: 독립적인 DTO 스키마 정의
export const CreateUserSchema = z.object({  // 절대 금지!
  email: z.string().email(),
  name: z.string(),
});
```

### 4️⃣ Mongoose 모델 구현 규칙
```typescript
// ✅ zod 타입을 구현하는 클래스 (MongoDB _id → zod id 매핑)
@Schema({ collection: 'users' })
export class UserModel extends BaseModel implements User {
  // _id는 BaseModel에서 처리 (MongoDB ObjectId)
  // zod 스키마의 id와 자동 매핑됨
  
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;
  
  // User 타입의 모든 필드를 정확히 구현 (id 제외)
}

// ❌ 금지: zod 타입과 무관한 모델 정의
@Schema()
export class UserModel {  // 절대 금지!
  @Prop()
  someField: any;  // zod 스키마에 없는 필드
}
```

### 6️⃣ 검증 함수 작성 규칙
```typescript
// ✅ validator 라이브러리 우선 사용
import validator from 'validator';

export const UserMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 패턴
  email: z.string().refine(validator.isEmail, 'Invalid email format'), // validator 활용
  password: z.string().refine(
    (val) => validator.isStrongPassword(val, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }),
    'Password must be strong'
  ),
  name: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters'
  ),
  bio: z.string().refine(
    (val) => !val || validator.isLength(val, { max: 500 }),
    'Bio must be less than 500 characters'
  ).optional(),
  avatar: z.string().refine(validator.isURL, 'Invalid URL format').optional(),
  role: z.enum(['user', 'admin']).default('user'),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ✅ 커스텀 검증 함수 (validator에 없는 경우만)
const isValidSlug = (value: string): boolean => {
  return /^[a-z0-9-]+$/.test(value) && value.length >= 1 && value.length <= 100;
};

export const PostMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  title: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 200 }),
    'Title must be 1-200 characters'
  ),
  content: z.string().refine(
    (val) => validator.isLength(val, { min: 1 }),
    'Content is required'
  ),
  excerpt: z.string().refine(
    (val) => !val || validator.isLength(val, { max: 300 }),
    'Excerpt must be less than 300 characters'
  ).optional(),
  slug: z.string().refine(isValidSlug, 'Invalid slug format'), // 커스텀 함수
  // ...
});

// ❌ 금지: validator에 있는 기능을 직접 구현
const customEmailValidator = (email: string) => {  // 절대 금지!
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // validator.isEmail 사용해야 함
};

// ❌ 금지: 단순 정규식보다 validator 함수 우선
z.string().regex(/^https?:\/\//) // 금지! validator.isURL 사용
z.string().refine(validator.isURL) // 올바른 방법
```

### 5️⃣ MongoDB ObjectId 처리 규칙
```typescript
// ✅ 주요 validator 함수 활용 예시
import validator from 'validator';

// 이메일 검증
z.string().refine(validator.isEmail, 'Invalid email')

// URL 검증
z.string().refine(validator.isURL, 'Invalid URL')

// 강력한 패스워드 검증
z.string().refine(
  (val) => validator.isStrongPassword(val, options),
  'Password not strong enough'
)

// 길이 검증
z.string().refine(
  (val) => validator.isLength(val, { min: 1, max: 100 }),
  'Invalid length'
)

// 알파뉴메릭 검증
z.string().refine(validator.isAlphanumeric, 'Must be alphanumeric')

// 숫자 검증
z.string().refine(validator.isNumeric, 'Must be numeric')

// JSON 검증
z.string().refine(validator.isJSON, 'Invalid JSON format')

// UUID 검증 (필요시)
z.string().refine(validator.isUUID, 'Invalid UUID')

// 헥스 컬러 검증
z.string().refine(validator.isHexColor, 'Invalid hex color')

// IP 주소 검증
z.string().refine(validator.isIP, 'Invalid IP address')

// 커스텀 함수가 필요한 경우만 직접 작성
const isMongoObjectId = (value: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(value); // validator에 없음
};

const isValidSlug = (value: string): boolean => {
  return /^[a-z0-9-]+$/.test(value) && value.length >= 1; // 복합 조건
};
```
```typescript
// ✅ zod 스키마: id는 문자열로 정의
export const UserMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 패턴
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ✅ BaseModel: _id ↔ id 변환 처리
export abstract class BaseModel {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Types.ObjectId;

  // Virtual field: _id → id 변환
  get id(): string {
    return this._id.toHexString();
  }

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

// ✅ Mongoose 스키마 설정 (전역 적용)
// mongoose.connect 시 설정
mongoose.set('versionKey', false); // __v 필드 비활성화

// ✅ 개별 스키마 설정 (스키마별 적용)
@Schema({ 
  collection: 'users',
  versionKey: false,     // __v 필드 비활성화
  timestamps: true,      // createdAt, updatedAt 자동 생성
  toJSON: {             // JSON 변환 시 설정
    virtuals: true,     // virtual 필드 포함
    transform: (doc, ret) => {
      ret.id = ret._id.toHexString();
      delete ret._id;
      delete ret.__v;   // 혹시 모를 __v 제거
      return ret;
    }
  }
})
export class UserModel extends BaseModel implements User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;
}

// ✅ 매퍼에서 _id → id 변환
export class UserMapper {
  static toEntity(model: UserDocument): User {
    const json = model.toJSON();
    return {
      ...json,
      id: model._id.toHexString(), // _id → id 변환
      _id: undefined, // _id 제거
    };
  }
}

// ❌ 금지: zod 스키마에서 _id 직접 사용
export const UserMasterSchema = z.object({
  _id: z.string(), // 절대 금지! id 사용해야 함
});
```

---

## 아키텍처 제약사항

### 파일 구조 규칙

#### schemas/ 디렉토리 (Single Source of Truth)
```
schemas/
├── master/              # 🔥 모든 타입의 유일한 원본
│   ├── user.schema.ts   # UserMasterSchema만 정의
│   ├── post.schema.ts   # PostMasterSchema만 정의
│   └── index.ts         # 모든 마스터 스키마 export
├── dto/                 # 마스터에서 파생된 DTO 스키마
│   ├── user.dto.ts      # CreateUser, UpdateUser 등 omit/partial 조합
│   └── index.ts
└── query/               # 쿼리 파라미터 스키마
    ├── pagination.ts
    └── index.ts
```

#### types/ 디렉토리 (타입 추론 전용)
```typescript
// ✅ types/entities/user.types.ts
import { UserMasterSchema, CreateUserSchema } from '@/schemas';

export type User = z.infer<typeof UserMasterSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ❌ 금지: 독립적인 타입 정의
export interface User {  // 절대 금지!
  id: string;
}
```

### 코드 작성 규칙

#### 1. 컨트롤러 레이어
```typescript
// ✅ zod 스키마로 검증
@Post()
@ZodBody(CreateUserSchema)
async create(@Body() dto: CreateUserDto) {  // 타입 추론 활용
  return this.userService.create(dto);
}

// ❌ 금지: class-validator DTO 혼용
@Post()
async create(@Body() dto: any) {  // 절대 금지!
  return this.userService.create(dto);
}
```

#### 2. 서비스 레이어
```typescript
// ✅ 명확한 타입 시그니처
async create(dto: CreateUserDto): Promise<User> {
  const model = new this.userModel(dto);
  const saved = await model.save();
  return UserMapper.toEntity(saved);  // Model → Entity 변환
}

// ❌ 금지: any 반환
async create(dto: any): Promise<any> {  // 절대 금지!
  return await this.userModel.create(dto);
}
```

#### 3. 매퍼 레이어
```typescript
// ✅ 타입 안전한 변환
export class UserMapper {
  static toEntity(model: UserDocument): User {
    return UserMasterSchema.parse(model.toJSON());
  }
  
  static toResponse(entity: User): UserResponse {
    return UserResponseSchema.parse(entity);
  }
}

// ❌ 금지: 타입 없는 변환
export class UserMapper {
  static toEntity(model: any): any {  // 절대 금지!
    return model;
  }
}
```

---

## 구현 가이드라인

### 새로운 엔티티 추가 시 체크리스트

#### Step 1: 마스터 스키마 정의
```typescript
// schemas/master/entity.schema.ts
export const EntityMasterSchema = z.object({
  id: z.string().uuid(),
  // ... 필드 정의
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### Step 2: DTO 스키마 파생
```typescript
// schemas/dto/entity.dto.ts
export const CreateEntitySchema = EntityMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateEntitySchema = CreateEntitySchema.partial();
```

#### Step 3: 타입 추론
```typescript
// types/entities/entity.types.ts
export type Entity = z.infer<typeof EntityMasterSchema>;
export type CreateEntityDto = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityDto = z.infer<typeof UpdateEntitySchema>;
```

#### Step 4: Mongoose 모델 구현
```typescript
// models/entity.model.ts
@Schema()
export class EntityModel extends BaseModel implements Entity {
  // Entity 타입의 모든 필드를 정확히 구현
}
```

### 스키마 변경 시 워크플로우

1. **마스터 스키마 수정** → `schemas/master/entity.schema.ts`
2. **타입 체크 실행** → `npm run type-check`
3. **컴파일 에러 수정** → 자동으로 모든 관련 타입 업데이트
4. **테스트 실행** → `npm run test`

---

## 기술 스택 상세

### 백엔드 핵심
- **NestJS 11.x**: 메인 프레임워크
- **TypeScript 5.7.x**: 정적 타입 시스템
- **MongoDB**: 메인 데이터베이스
- **Mongoose**: ODM

### 스키마 & 검증
- **Zod 3.x**: 스키마 정의 및 런타임 검증 (Single Source of Truth)
- **Custom Zod Validation Pipe**: NestJS 검증 파이프라인 통합

### 인증 & 보안
- **Passport.js**: 인증 전략
- **JWT**: 토큰 기반 인증
- **bcrypt**: 패스워드 해싱

### 개발 도구
- **Swagger**: API 문서 자동 생성
- **Jest**: 단위 테스트
- **ESLint + Prettier**: 코드 품질 관리

---

## 데모 도메인: 블로그 플랫폼

### 핵심 엔티티 설계

#### 1. User (사용자)
```typescript
import validator from 'validator';

export const UserMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 문자열
  email: z.string().refine(validator.isEmail, 'Invalid email format'),
  password: z.string().refine(
    (val: string) => validator.isStrongPassword(val, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }),
    'Password must be strong'
  ),
  name: z.string().refine(
    (val: string) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters'
  ),
  bio: z.string().refine(
    (val: string) => !val || validator.isLength(val, { max: 500 }),
    'Bio must be less than 500 characters'
  ).optional(),
  avatar: z.string().refine(validator.isURL, 'Invalid URL format').optional(),
  role: z.enum(['user', 'admin']).default('user'),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### 2. Post (게시글)
```typescript
import validator from 'validator';

// 커스텀 검증 함수 (validator에 없는 경우만)
const isValidSlug = (value: string): boolean => {
  return /^[a-z0-9-]+$/.test(value) && validator.isLength(value, { min: 1, max: 100 });
};

export const PostMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 문자열
  title: z.string().refine(
    (val: string) => validator.isLength(val, { min: 1, max: 200 }),
    'Title must be 1-200 characters'
  ),
  content: z.string().refine(
    (val: string) => validator.isLength(val, { min: 1 }),
    'Content is required'
  ),
  excerpt: z.string().refine(
    (val: string) => !val || validator.isLength(val, { max: 300 }),
    'Excerpt must be less than 300 characters'
  ).optional(),
  slug: z.string().refine(isValidSlug, 'Invalid slug format'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  authorId: z.string().regex(/^[0-9a-fA-F]{24}$/), // User 참조
  categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).default([]), // Category 참조 배열
  tags: z.array(z.string().refine(
    (val: string) => validator.isLength(val, { min: 1, max: 50 }),
    'Tag must be 1-50 characters'
  )).default([]),
  viewCount: z.number().int().min(0).default(0),
  likesCount: z.number().int().min(0).default(0),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### 3. Comment (댓글)
```typescript
import validator from 'validator';

export const CommentMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 문자열
  content: z.string().refine(
    (val: string) => validator.isLength(val, { min: 1, max: 1000 }),
    'Comment must be 1-1000 characters'
  ),
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/), // Post 참조
  authorId: z.string().regex(/^[0-9a-fA-F]{24}$/), // User 참조
  parentCommentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(), // Comment 자기 참조
  isApproved: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### 4. Category (카테고리)
```typescript
import validator from 'validator';

export const CategoryMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId 문자열
  name: z.string().refine(
    (val: string) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters'
  ),
  slug: z.string().refine(isValidSlug, 'Invalid slug format'),
  description: z.string().refine(
    (val: string) => !val || validator.isLength(val, { max: 200 }),
    'Description must be less than 200 characters'
  ).optional(),
  color: z.string().refine(validator.isHexColor, 'Invalid hex color').optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

---

## API 엔드포인트 설계

### Authentication
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `GET /auth/profile` - 프로필 조회

### Users
- `GET /users` - 사용자 목록 (관리자만)
- `GET /users/:id` - 사용자 상세
- `PATCH /users/:id` - 사용자 정보 수정
- `DELETE /users/:id` - 사용자 삭제 (소프트 삭제)

### Posts
- `GET /posts` - 게시글 목록 (페이지네이션, 필터링)
- `GET /posts/:slug` - 게시글 상세
- `POST /posts` - 게시글 작성
- `PATCH /posts/:id` - 게시글 수정
- `DELETE /posts/:id` - 게시글 삭제
- `POST /posts/:id/like` - 좋아요 토글

### Comments
- `GET /posts/:postId/comments` - 댓글 목록
- `POST /posts/:postId/comments` - 댓글 작성
- `PATCH /comments/:id` - 댓글 수정
- `DELETE /comments/:id` - 댓글 삭제

### Categories
- `GET /categories` - 카테고리 목록
- `POST /categories` - 카테고리 생성 (관리자만)
- `PATCH /categories/:id` - 카테고리 수정 (관리자만)
- `DELETE /categories/:id` - 카테고리 삭제 (관리자만)

---

## 디렉토리 구조 (최종 검증 대상)

```
src/
├── schemas/                     # 🔥 zod 스키마 중앙 관리 (Single Source of Truth)
│   ├── master/                  # 🔥 모든 타입의 유일한 원본
│   │   ├── user.schema.ts       # UserMasterSchema (id: MongoDB ObjectId 문자열)
│   │   ├── post.schema.ts       # PostMasterSchema (authorId, categoryIds 관계)
│   │   ├── comment.schema.ts    # CommentMasterSchema (postId, authorId, parentCommentId)
│   │   ├── category.schema.ts   # CategoryMasterSchema
│   │   └── index.ts             # 모든 마스터 스키마 export
│   ├── dto/                     # 마스터에서 파생된 DTO 스키마
│   │   ├── auth.dto.schema.ts   # Login, Register 스키마 (id 제외)
│   │   ├── user.dto.schema.ts   # CreateUser, UpdateUser 등 (id, timestamps 제외)
│   │   ├── post.dto.schema.ts   # CreatePost, UpdatePost 등
│   │   ├── comment.dto.schema.ts
│   │   ├── category.dto.schema.ts
│   │   └── index.ts
│   ├── query/                   # 쿼리 파라미터 스키마
│   │   ├── pagination.schema.ts
│   │   ├── post.query.schema.ts # ObjectId 필터링 포함
│   │   ├── user.query.schema.ts
│   │   └── index.ts
│   ├── response/                # API 응답 스키마
│   │   ├── user.response.schema.ts  # password 제외, id 포함
│   │   ├── post.response.schema.ts  # populate된 관계 데이터 포함
│   │   ├── common.response.schema.ts
│   │   └── index.ts
│   └── shared/
│       ├── common.schema.ts     # ObjectId 패턴, 공통 validation
│       └── validation.schema.ts
├── types/                       # 🔥 타입 정의 (스키마에서 추론만)
│   ├── entities/                # 마스터 스키마에서 추론 (id: string)
│   │   ├── user.types.ts
│   │   ├── post.types.ts
│   │   ├── comment.types.ts
│   │   ├── category.types.ts
│   │   └── index.ts
│   ├── dto/                     # DTO 스키마에서 추론
│   │   ├── auth.dto.types.ts
│   │   ├── user.dto.types.ts
│   │   ├── post.dto.types.ts
│   │   ├── comment.dto.types.ts
│   │   ├── category.dto.types.ts
│   │   └── index.ts
│   ├── api/                     # 응답 스키마에서 추론
│   │   ├── responses.types.ts
│   │   └── index.ts
│   └── shared/
│       ├── common.types.ts
│       └── pagination.types.ts
├── models/                      # 🔥 Mongoose 모델 (zod 타입 구현, _id ↔ id 매핑)
│   ├── base.model.ts            # _id → id virtual, timestamps
│   ├── user.model.ts            # User 타입을 구현 (MongoDB _id 처리)
│   ├── post.model.ts            # Post 타입을 구현 (ObjectId 참조)
│   ├── comment.model.ts         # Comment 타입을 구현
│   ├── category.model.ts        # Category 타입을 구현
│   └── index.ts
├── common/                      # 공통 유틸리티
│   ├── decorators/
│   │   ├── zod-body.decorator.ts
│   │   ├── zod-query.decorator.ts
│   │   └── zod-param.decorator.ts
│   ├── pipes/
│   │   └── zod-validation.pipe.ts
│   ├── guards/
│   ├── filters/
│   │   └── zod-exception.filter.ts
│   ├── mappers/                 # 타입 안전한 변환 레이어
│   │   ├── user.mapper.ts
│   │   ├── post.mapper.ts
│   │   ├── comment.mapper.ts
│   │   ├── category.mapper.ts
│   │   └── index.ts
│   └── utils/
├── modules/                     # 기능별 모듈
│   ├── auth/
│   ├── users/
│   ├── posts/
│   ├── comments/
│   ├── categories/
│   └── ...
└── database/
    ├── connection.ts
    └── seeds/
```

---

## 🚀 구현 순서 (필수 준수)

### 기본 원칙
1. **컬렉션 단위로 순차적 구현** - 한 번에 하나의 엔티티만 완전히 구현
2. **스키마 우선 구현** - zod 스키마와 타입을 먼저 완성한 후 기능 구현
3. **단계별 완성도 검증** - 각 단계 완료 후 타입 체크 및 테스트 통과 확인

### 전체 구현 순서

#### Phase 0: 기반 인프라 구축
```
1. 프로젝트 초기 설정
   - NestJS 프로젝트 생성
   - MongoDB, Mongoose 설정 (__v 필드 비활성화 포함)
   - 의존성 설치:
     * zod (런타임 스키마 검증)
     * validator (검증 함수 라이브러리)
     * @types/validator (개발 의존성 - 타입 정의)
   - ESLint 규칙 설정 (any 금지, 타입 안전성)

2. 공통 스키마 및 유틸리티
   - BaseSchema (MongoDB ObjectId 패턴, createdAt, updatedAt)
   - ObjectIdSchema 유틸리티 함수
   - validator 라이브러리 활용한 검증 함수 모음
   - PaginationSchema, SortingSchema
   - ZodValidationPipe 구현
   - @ZodBody, @ZodQuery, @ZodParam 데코레이터
   - ZodExceptionFilter 구현
```

#### Phase 1: User 컬렉션 완전 구현
```
🔥 스키마 우선 구현
1. schemas/master/user.schema.ts
   - UserMasterSchema 정의 (id: MongoDB ObjectId 문자열)
   - 모든 필드 완전 정의 (validation 포함)

2. schemas/dto/user.dto.schema.ts
   - CreateUserSchema (id, timestamps omit)
   - UpdateUserSchema (id, timestamps omit, partial)
   - LoginSchema, RegisterSchema

3. schemas/response/user.response.schema.ts
   - UserResponseSchema (password 제외, id 포함)
   - UserListResponseSchema

4. types/entities/user.types.ts
   - User 타입 추론 (id: string)
   - CreateUserDto, UpdateUserDto 타입 추론

5. 타입 체크 실행 ✅
   - npm run type-check 통과 확인

🔥 모델 및 기능 구현
6. models/user.model.ts
   - UserModel 클래스 (User 타입 구현)
   - BaseModel 상속 (_id ↔ id 자동 변환)
   - Mongoose 스키마 생성 (versionKey: false, timestamps: true)

7. common/mappers/user.mapper.ts
   - UserMapper 구현 (_id → id 변환, __v 제거)

8. modules/users/
   - users.service.ts (타입 안전한 CRUD, ObjectId 처리)
   - users.controller.ts (@ZodBody 데코레이터 활용)
   - users.module.ts

9. 단위 테스트 작성 및 실행 ✅
   - User 스키마 테스트 (ObjectId 패턴 검증)
   - UserMapper 테스트 (_id ↔ id 변환)
   - UsersService 테스트

10. E2E 테스트 작성 및 실행 ✅
    - User CRUD API 테스트 (MongoDB ObjectId 응답)
```

#### Phase 2: Category 컬렉션 완전 구현
```
🔥 스키마 우선 구현
1. schemas/master/category.schema.ts
   - CategoryMasterSchema 정의

2. schemas/dto/category.dto.schema.ts
   - CreateCategorySchema, UpdateCategorySchema

3. schemas/response/category.response.schema.ts
   - CategoryResponseSchema

4. types/entities/category.types.ts
   - Category 타입 추론

5. 타입 체크 실행 ✅

🔥 모델 및 기능 구현
6. models/category.model.ts
7. common/mappers/category.mapper.ts
8. modules/categories/
9. 단위 테스트 ✅
10. E2E 테스트 ✅
```

#### Phase 3: Post 컬렉션 완전 구현 (관계형 데이터)
```
🔥 스키마 우선 구현
1. schemas/master/post.schema.ts
   - PostMasterSchema 정의
   - authorId, categoryIds 관계 필드 포함

2. schemas/dto/post.dto.schema.ts
   - CreatePostSchema, UpdatePostSchema
   - 관계 필드 검증 로직 포함

3. schemas/query/post.query.schema.ts
   - PostQuerySchema (필터링, 정렬)
   - PopulateOptionsSchema

4. schemas/response/post.response.schema.ts
   - PostResponseSchema
   - PostWithAuthorSchema, PostWithCategoriesSchema

5. types/entities/post.types.ts
   - Post 타입 추론
   - PostWithRelations 타입 추론

6. 타입 체크 실행 ✅

🔥 모델 및 기능 구현
7. models/post.model.ts (관계 참조 포함)
8. common/mappers/post.mapper.ts (관계 데이터 변환)
9. modules/posts/ (populate 로직 포함)
10. 단위 테스트 ✅ (관계 데이터 테스트)
11. E2E 테스트 ✅ (populate API 테스트)
```

#### Phase 4: Comment 컬렉션 완전 구현 (복합 관계)
```
🔥 스키마 우선 구현
1. schemas/master/comment.schema.ts
   - CommentMasterSchema 정의
   - postId, authorId, parentCommentId 관계

2. schemas/dto/comment.dto.schema.ts
   - CreateCommentSchema, UpdateCommentSchema
   - 대댓글 로직 검증

3. schemas/response/comment.response.schema.ts
   - CommentResponseSchema
   - CommentTreeResponseSchema (계층 구조)

4. types/entities/comment.types.ts
   - Comment 타입 추론
   - CommentTree 타입 추론

5. 타입 체크 실행 ✅

🔥 모델 및 기능 구현
6. models/comment.model.ts
7. common/mappers/comment.mapper.ts (트리 구조 변환)
8. modules/comments/ (계층 쿼리 로직)
9. 단위 테스트 ✅ (트리 구조 테스트)
10. E2E 테스트 ✅ (대댓글 API 테스트)
```

#### Phase 5: Auth 모듈 구현 (통합)
```
🔥 스키마 우선 구현
1. schemas/dto/auth.dto.schema.ts
   - LoginSchema, RegisterSchema
   - RefreshTokenSchema

2. schemas/response/auth.response.schema.ts
   - AuthResponseSchema (토큰 포함)

3. types/dto/auth.dto.types.ts
   - LoginDto, RegisterDto 타입 추론

4. 타입 체크 실행 ✅

🔥 인증 기능 구현
5. modules/auth/
   - auth.service.ts (User 타입 활용)
   - auth.controller.ts (@ZodBody 활용)
   - jwt.strategy.ts, local.strategy.ts

6. 통합 테스트 ✅
   - 전체 인증 플로우 테스트
```

### 각 단계별 필수 체크리스트

#### 스키마 구현 단계 체크리스트
```
□ 마스터 스키마에 모든 필드 정의 완료
□ validator 라이브러리 우선 사용, 없는 경우만 커스텀 함수 작성
□ 모든 DTO 스키마가 마스터에서 omit/partial로 파생됨
□ 응답 스키마에 민감한 정보 제외 로직 포함
□ 타입 추론 파일에서 z.infer만 사용 (독립 타입 정의 금지)
□ npm run type-check 통과
□ 스키마 단위 테스트 작성 및 통과 (validator 함수 포함)
```

#### 기능 구현 단계 체크리스트
```
□ Mongoose 모델이 zod 타입을 정확히 구현
□ 스키마 설정: versionKey: false, timestamps: true 적용
□ toJSON transform에서 _id → id 변환, __v 제거
□ 모든 컨트롤러에서 @ZodBody/@ZodQuery 데코레이터 사용
□ 서비스 레이어의 모든 메서드에 명확한 타입 시그니처
□ 매퍼 클래스에서 타입 안전한 변환 구현
□ any 타입 사용 0개 확인
□ 단위 테스트 작성 및 통과
□ E2E 테스트 작성 및 통과
```

#### 컬렉션 완료 단계 검증
```
□ 전체 타입 체크 통과
□ 해당 엔티티의 모든 CRUD API 정상 작동
□ Swagger 문서 자동 생성 확인
□ 관계형 데이터 population 정상 작동 (해당하는 경우)
□ 에러 핸들링이 zod 스키마와 일치
```

### 구현 시 주의사항

#### 컬렉션 순서를 지키는 이유
1. **User** → 모든 엔티티의 기본 참조 대상
2. **Category** → Post의 단순 참조 관계
3. **Post** → 복잡한 관계 (User + Category 참조)
4. **Comment** → 가장 복잡한 관계 (User + Post + 자기 참조)
5. **Auth** → 모든 엔티티를 활용하는 통합 모듈

#### 각 단계에서 절대 금지사항
```typescript
// ❌ 스키마 단계에서 기능 구현 금지
// schemas/master/user.schema.ts에서 service 로직 작성 금지

// ❌ 기능 단계에서 독립적인 타입 정의 금지
interface CustomUser {  // 절대 금지!
  id: string;
}

// ❌ 다음 컬렉션 구현 전에 현재 컬렉션 미완성 금지
// User 컬렉션 테스트 통과 전에 Category 구현 시작 금지
```

---

## 검증 시나리오

### Phase 1: 기본 CRUD 검증

**목표**: Single Source of Truth 패턴의 기본 구현

**구현 범위**:
- zod 마스터 스키마 정의 (UserMasterSchema)
- omit/partial을 활용한 DTO 스키마 자동 생성
- 타입 추론 검증 (User, CreateUserDto, UpdateUserDto)
- ZodValidationPipe 구현 및 적용
- @ZodBody, @ZodQuery, @ZodParam 데코레이터 구현
- Mongoose 모델과 zod 타입 간 인터페이스 구현
- 기본 CRUD 엔드포인트 (타입 안전성 포함)
- 에러 핸들링 및 zod 에러 메시지 포맷팅

**검증 포인트**:
- 스키마 변경 시 모든 관련 타입이 자동으로 업데이트되는가?
- 컴파일 타임과 런타임 검증이 모두 정확한가?
- 코드 자동완성이 정확하게 작동하는가?

### Phase 2: 엔티티 관계 검증

**목표**: 복잡한 관계에서의 타입 안전성 유지

**구현 범위**:
- Post, Comment, Category 마스터 스키마 정의
- 엔티티 간 참조 관계 스키마 설계 (MongoDB ObjectId 활용)
- 관계형 쿼리 파라미터 스키마 (population, filtering)
- 중첩 DTO 검증 (Post with Author, Comment with Post)
- UserMapper, PostMapper 등 변환 레이어 구현
- 순환 참조 방지 패턴 적용

**검증 포인트**:
- 관계형 데이터의 타입 추론이 정확한가?
- Population 시 타입 안전성이 유지되는가?
- 순환 참조 문제가 발생하지 않는가?

### Phase 3: 고급 기능 검증

**목표**: 실무 수준의 복잡한 스키마 관리

**구현 범위**:
- 복합 쿼리 스키마 (pagination + sorting + filtering)
- 조건부 스키마 생성 (권한별 다른 DTO)
- 파일 업로드 스키마 검증
- zod 스키마 기반 Swagger 문서 자동 생성
- 에러 응답 표준화 (ZodExceptionFilter)
- 스키마 캐싱 및 성능 최적화

**검증 포인트**:
- 복잡한 쿼리 조건의 타입 안전성이 유지되는가?
- 동적 스키마 생성이 안정적으로 작동하는가?
- API 문서가 zod 스키마와 정확히 동기화되는가?

---

## 성공 기준

### Single Source of Truth 검증
- [ ] zod 마스터 스키마에서 모든 타입이 자동 생성되는가?
- [ ] omit/partial 조합으로 DTO 스키마가 정확히 파생되는가?
- [ ] 스키마 변경 시 모든 관련 타입이 자동 업데이트되는가?
- [ ] **중복 타입 정의가 0개인가?** (interface, type 별도 정의 금지)

### 타입 안전성 검증
- [ ] 컴파일 타임 타입 에러 100% 검출
- [ ] zod 스키마와 Mongoose 모델 간 타입 일치성
- [ ] API 응답 타입과 실제 응답 100% 일치
- [ ] 런타임 검증 에러의 정확한 필드 지적
- [ ] **프로덕션 코드에서 any 타입 사용이 0개인가?** (테스트 코드는 허용, unknown은 허용)

### NestJS 파이프라인 통합
- [ ] ZodValidationPipe가 모든 에러를 정확히 포착하는가?
- [ ] @ZodBody, @ZodQuery 데코레이터가 정상 작동하는가?
- [ ] 에러 메시지 포맷팅이 일관성 있게 처리되는가?

### 개발 효율성
- [ ] 새로운 엔티티 추가 시 기존 패턴 재사용 가능성
- [ ] 스키마 변경 후 전체 타입 동기화 자동화
- [ ] 중복 코드 제거 (스키마, DTO, 타입 정의)

### 고급 기능 구현
- [ ] **계층형 댓글 시스템**: 대댓글, 트리 구조
- [ ] **복합 쿼리**: 필터링, 정렬, 페이지네이션
- [ ] **관계형 데이터**: Population, 참조 처리
- [ ] **JWT 토큰 관리**: Access/Refresh 토큰, 무효화
- [ ] **소프트 삭제**: 비활성화 기반 삭제

### 개발자 경험 개선
- [ ] **Swagger 통합**: zod 스키마 기반 자동 문서
- [ ] **에러 처리**: 표준화된 에러 응답
- [ ] **타입 안전성**: 컴파일 타임 + 런타임 검증

---

## 위험 요소 및 대응 방안

### 기술적 위험

**위험**: zod 스키마 복잡도 증가 시 타입 추론 성능 저하  
**대응**: 스키마 분할, 지연 로딩, 스키마 캐싱 패턴 적용

**위험**: 순환 참조로 인한 타입 에러 (User ↔ Post ↔ Comment)  
**대응**: 인터페이스 기반 분리, 전방 선언(forward reference) 활용

**위험**: Mongoose 모델과 zod 타입 간 불일치  
**대응**: BaseModel 추상화, 런타임 검증 레이어, 타입 가드 구현

**위험**: omit/partial 과도한 사용으로 인한 타입 복잡성  
**대응**: 유틸리티 함수 제공 (createDtoSchema, createUpdateSchema)

**위험**: Single Source of Truth 원칙 위반  
**대응**: ESLint 규칙 설정, 코드 리뷰 체크리스트, 자동 검증 스크립트

---

## 코드 품질 관리

### ESLint 규칙 (강제 적용)
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 프로덕션 코드에서 any 타입 사용 금지 (테스트 코드는 허용)
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // 중복 타입 정의 금지 (커스텀 규칙)
    'no-duplicate-type-definitions': 'error',
  },
  overrides: [
    {
      // 테스트 파일에서만 any 사용 허용
      files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ],
};
```

### Pre-commit Hook
```bash
#!/bin/sh
# 타입 체크
npm run type-check

# 포맷팅 검사 (파일 수정 없이)
npm run format:check

# 린트 검사 (any 타입 사용 포함)
npm run lint
```

---

## 산출물

### 코드 저장소
- Single Source of Truth 패턴 완전 구현
- ZodValidationPipe 및 데코레이터 시스템
- 타입 안전 Mongoose 모델 통합
- 단위 테스트 (스키마 동기화, 타입 추론 검증)
- E2E 테스트 (API 엔드포인트 검증)
- Swagger 문서 (zod 스키마 기반 자동 생성)

### 검증 결과
- zod → TypeScript → Mongoose 연결고리 안정성 평가
- 타입 추론 성능 및 컴파일 시간 측정
- 실무 적용 시 발생 가능한 문제점 및 해결책
- Single Source of Truth 패턴 준수율 측정 (100% 목표)
- 프로덕션 코드에서 any 타입 사용률 측정 (0% 목표, 테스트 코드 제외)

### 문서화
- zod 스키마 설계 가이드라인
- 타입 안전성 체크리스트
- 새로운 엔티티 추가 단계별 매뉴얼
- 스키마 변경 시 영향도 분석 방법론