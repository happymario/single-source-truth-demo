# 프로젝트 작업 관리

## Epic: Zod 중심 데이터 관리 아키텍처 구현

### Story: 프로젝트 초기 설정 ✅

### Story: Phase 0 - 기반 인프라 구축
- [ ] BaseSchema 및 공통 유틸리티 구현
- [ ] ZodValidationPipe 구현
- [ ] Zod 데코레이터 구현 (@ZodBody, @ZodQuery, @ZodParam)
- [ ] ZodExceptionFilter 구현
- [ ] 공통 모듈 구조 설정

### Story: Phase 1 - User 컬렉션 구현
- [ ] UserMasterSchema 정의
- [ ] User DTO 스키마 파생 (Create, Update)
- [ ] User 타입 추론 파일 생성
- [ ] UserModel 구현 (BaseModel 상속)
- [ ] UserMapper 구현
- [ ] UsersService 구현
- [ ] UsersController 구현
- [ ] User 단위 테스트 작성
- [ ] User E2E 테스트 작성

### Story: Phase 2 - Category 컬렉션 구현
- [ ] CategoryMasterSchema 정의
- [ ] Category DTO 및 타입 구현
- [ ] CategoryModel 구현
- [ ] CategoryMapper 구현
- [ ] Categories 모듈 완성
- [ ] Category 테스트 작성

### Story: Phase 3 - Post 컬렉션 구현
- [ ] PostMasterSchema 정의 (관계 포함)
- [ ] Post DTO 및 쿼리 스키마 구현
- [ ] PostModel 구현 (관계 참조)
- [ ] PostMapper 구현 (populate 로직)
- [ ] Posts 모듈 완성
- [ ] Post 관계형 데이터 테스트

### Story: Phase 4 - Comment 컬렉션 구현
- [ ] CommentMasterSchema 정의 (자기 참조 포함)
- [ ] Comment 트리 구조 스키마 구현
- [ ] CommentModel 구현
- [ ] CommentMapper 구현 (계층 구조 변환)
- [ ] Comments 모듈 완성
- [ ] Comment 계층 구조 테스트

### Story: Phase 5 - Auth 모듈 구현
- [ ] Auth DTO 스키마 정의
- [ ] JWT 전략 구현
- [ ] AuthService 구현
- [ ] AuthController 구현
- [ ] Auth 통합 테스트