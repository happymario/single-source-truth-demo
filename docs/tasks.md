# 개발 작업 관리

## Epic: 린트 에러 해결 및 타입 안전성 강화

### Story 1: swagger-helpers.decorator.ts 타입 안전성 개선
**목표**: swagger-helpers.decorator.ts 파일의 모든 린트 에러 해결

#### Task 1.1: 타입 인터페이스 정의
- [ ] OpenAPISchema 인터페이스 정의
- [ ] ApiParamConfig 인터페이스 정의  
- [ ] ApiQueryConfig 인터페이스 정의
- [ ] 파일: `/src/common/decorators/swagger-helpers.decorator.ts`

#### Task 1.2: 타입 가드 함수 구현
- [ ] isZodObject 타입 가드 함수 추가
- [ ] hasZodDef 타입 가드 함수 추가
- [ ] isValidOpenAPIType 검증 함수 추가
- [ ] 파일: `/src/common/decorators/swagger-helpers.decorator.ts`

#### Task 1.3: ApiParamFromZod 함수 타입 안전성 개선
- [ ] options 변수 타입을 ApiParamConfig로 변경
- [ ] schema._example 접근을 안전한 방식으로 변경
- [ ] openApiSchema 속성 접근을 타입 가드로 보호
- [ ] 파일: `/src/common/decorators/swagger-helpers.decorator.ts`

#### Task 1.4: ApiQueryFromZod 함수 타입 안전성 개선
- [ ] fieldSchema 타입 캐스팅을 안전한 방식으로 변경
- [ ] fieldOpenApi 속성 접근을 타입 가드로 보호
- [ ] options 변수 타입을 ApiQueryConfig로 변경
- [ ] console.log 디버깅 코드 제거
- [ ] 파일: `/src/common/decorators/swagger-helpers.decorator.ts`

#### Task 1.5: extractExampleFromSchema 함수 개선
- [ ] 매개변수 타입을 ZodSchema로 명시
- [ ] _def 접근을 타입 가드로 보호
- [ ] 반환 타입을 명시적으로 정의
- [ ] 파일: `/src/common/decorators/swagger-helpers.decorator.ts`

### Story 2: zod-to-openapi.ts 타입 안전성 개선
**목표**: zod-to-openapi.ts 파일의 모든 린트 에러 해결

#### Task 2.1: Zod 내부 타입 인터페이스 정의
- [ ] ZodDef 인터페이스 정의
- [ ] ZodSchemaWithDef 인터페이스 정의
- [ ] ZodCheck 인터페이스 정의
- [ ] 파일: `/src/common/utils/zod-to-openapi.ts`

#### Task 2.2: 타입 가드 함수 구현
- [ ] hasZodDef 타입 가드 함수 추가
- [ ] hasTypeName 타입 가드 함수 추가
- [ ] isZodEffects 타입 가드 함수 추가
- [ ] isZodDefault 타입 가드 함수 추가
- [ ] 파일: `/src/common/utils/zod-to-openapi.ts`

#### Task 2.3: convertSchema 함수 ZodEffects 처리 개선
- [ ] ZodEffects 타입 체크를 타입 가드로 변경
- [ ] _def.schema 접근을 안전한 방식으로 변경
- [ ] _def.effect 접근을 안전한 방식으로 변경
- [ ] 파일: `/src/common/utils/zod-to-openapi.ts`

#### Task 2.4: convertSchema 함수 ZodDefault 처리 개선
- [ ] ZodDefault 타입 체크를 타입 가드로 변경
- [ ] _def.innerType 접근을 안전한 방식으로 변경
- [ ] _def.defaultValue 접근을 안전한 방식으로 변경
- [ ] 파일: `/src/common/utils/zod-to-openapi.ts`

#### Task 2.5: convertSchema 함수 기타 타입 처리 개선
- [ ] ZodString checks 배열 접근을 안전하게 변경
- [ ] ZodNumber checks 배열 접근을 안전하게 변경
- [ ] ZodUnion options 접근을 안전하게 변경
- [ ] 파일: `/src/common/utils/zod-to-openapi.ts`

### Story 3: 기타 파일 린트 에러 수정
**목표**: 나머지 파일들의 린트 에러 해결

#### Task 3.1: database.module.ts 수정
- [ ] useFactory 함수에서 불필요한 async 키워드 제거
- [ ] 파일: `/src/database/database.module.ts`

#### Task 3.2: roles.guard.ts 수정
- [ ] Reflector.get 호출 시 타입 안전성 개선
- [ ] 파일: `/src/modules/auth/guards/roles.guard.ts`

#### Task 3.3: comments.service.ts 수정
- [ ] findByIdAndUpdate 호출 시 string 타입 보장
- [ ] concat 메서드 호출 시 타입 안전성 개선
- [ ] 파일: `/src/modules/comments/comments.service.ts`

### Story 4: 검증 및 테스트
**목표**: 수정사항 검증 및 품질 보증

#### Task 4.1: 린트 검사
- [ ] `npm run lint` 실행하여 모든 에러 해결 확인
- [ ] 경고(warning) 수준 이슈 검토 및 필요시 수정

#### Task 4.2: 타입 체크
- [ ] `npm run build` 실행하여 타입 에러 없음 확인
- [ ] TypeScript 컴파일 성공 확인

#### Task 4.3: 기능 테스트
- [ ] Swagger 문서 생성 정상 동작 확인
- [ ] API 파라미터 및 쿼리 문서화 정상 동작 확인
- [ ] 예제 데이터 표시 정상 동작 확인

#### Task 4.4: 단위 테스트 실행
- [ ] `npm run test` 실행하여 기존 테스트 통과 확인
- [ ] 필요시 수정된 코드에 대한 테스트 추가

## 완료된 Story

### ✅ Swagger 문서화 시스템 구축 (완료)
- [x] @ZodBody 데코레이터 Swagger 통합
- [x] withExample 유틸리티 구현 및 모든 스키마 적용  
- [x] ApiParamFromZod, ApiQueryFromZod 헬퍼 함수 구현
- [x] 모든 컨트롤러에 Swagger 헬퍼 적용
- [x] 쿼리 파라미터 타입 및 예제 데이터 정상 출력 확인

## 작업 원칙

1. **단일 책임**: 각 태스크는 하나의 명확한 목적만 가짐
2. **점진적 개선**: 파일별로 순차적 수정
3. **검증 필수**: 각 스토리 완료 후 빌드 및 린트 체크
4. **롤백 가능**: 문제 발생 시 이전 상태로 복구 가능한 단위로 작업