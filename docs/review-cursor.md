## 🚨 현재 구현과 PRD 내용 간의 부합하지 않는 부분들

### 1. **any 타입 사용 금지 원칙 위반 (심각)**

#### 📍 Posts 컨트롤러 - 모든 메서드에서 any 타입 사용
```45:209:src/modules/posts/posts.controller.ts
async create(@Body() createPostDto: any) // ❌ PRD 위반
async findAll(@ZodQuery(PostListQuerySchema) query: any) // ❌ PRD 위반
// 모든 메서드에서 any 타입 사용 중
```

#### 📍 테스트 파일들에서 any 타입 사용
- `src/modules/auth/auth.service.spec.ts` - 48번 라인
- `src/modules/posts/posts.service.spec.ts` - 11-13번 라인  
- `test/posts.e2e-spec.ts` - 237, 249번 라인

**PRD 요구사항**: any 타입 절대 금지, unknown 사용 후 타입 가드 적용

---

### 2. **Single Source of Truth 원칙 위반**

#### 📍 독립적인 interface 정의 
```48:51:src/schemas/dto/comment.dto.schema.ts
export interface CommentTreeNode extends z.infer<typeof CommentMasterSchema> {
  children: CommentTreeNode[];
}
```

#### 📍 스키마 파일에서 타입 정의
```82:82:src/schemas/master/user.schema.ts
export type UserMaster = z.infer<typeof UserMasterSchema>;
```

**PRD 요구사항**: 모든 타입은 `types/` 디렉토리에서 `z.infer`로만 추론

---

### 3. **컨트롤러 레이어 패턴 위반**

#### 📍 @ZodBody 데코레이터 누락
```44:46:src/modules/posts/posts.controller.ts
@Post()
@HttpCode(HttpStatus.CREATED)
async create(@Body() createPostDto: any) {
```

**PRD 요구사항**: 모든 컨트롤러에서 `@ZodBody`, `@ZodQuery`, `@ZodParam` 데코레이터 사용

---

### 4. **타입 시그니처 누락**

#### 📍 Posts 서비스와 컨트롤러에서 명확한 타입 시그니처 부재
- Posts 관련 모든 메서드에서 `any` 타입 사용으로 타입 안전성 상실

**PRD 요구사항**: 서비스 레이어의 모든 메서드에 명확한 타입 시그니처 적용

---

### 5. **추가적인 개선 사항**

#### ✅ 올바르게 구현된 부분들:
- **User 모듈**: Single Source of Truth 원칙 준수
- **validator 라이브러리 활용**: PRD 요구사항에 맞게 검증 함수 구현
- **BaseModel**: `_id ↔ id` 변환 올바르게 구현
- **매퍼 패턴**: 타입 안전한 변환 구현
- **의존성 관리**: `validator`, `@types/validator` 올바르게 설치

#### ⚠️ 주의할 부분:
- **RequestWithUser interface**: Auth 가드에서 사용하는 interface는 NestJS 패턴이므로 허용 범위
- **커스텀 검증 함수**: validator 라이브러리에 없는 기능만 구현하여 PRD 원칙 준수

---

## 🔧 수정이 필요한 우선순위

### 1. **즉시 수정 필요 (심각도: 🔴)**
- Posts 컨트롤러의 모든 `any` 타입을 적절한 DTO 타입으로 변경
- `@ZodBody` 데코레이터 추가

### 2. **구조적 개선 필요 (심각도: 🟡)**
- `CommentTreeNode` interface를 zod 스키마 기반으로 재정의
- 스키마 파일에서 타입 정의 제거 후 `types/` 디렉토리로 이동

### 3. **테스트 코드 개선 (심각도: 🟢)**
- 테스트 파일의 `any` 타입을 명확한 타입으로 변경
- Mock 객체에 타입 정의 적용

현재 User 모듈은 PRD 요구사항을 거의 완벽하게 준수하고 있으나, Posts 모듈은 전면적인 리팩토링이 필요한 상황입니다.