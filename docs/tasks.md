# 개발 작업 목록 (우선순위 순)

이 문서는 `cross-validation-report.md`의 분석 결과를 바탕으로 생성된 실행 가능한 개발 작업 목록입니다.

---

## 🔴 Priority 1: 즉시 수정 (블로커 해소)

*PRD의 핵심 원칙을 위반하여 타입 안정성을 심각하게 저해하는 문제들입니다. 최우선으로 해결해야 합니다.*

- [ ] **1. `Posts` 모듈 전체 타입 재정의**
  - **설명:** `posts.controller.ts`와 `posts.service.ts`에 하드코딩된 `any` 타입을 모두 제거합니다.
  - **조치:**
    - 컨트롤러 메서드의 파라미터에 `CreatePostDto`, `UpdatePostDto`, `PostListQueryDto` 등 `types/dto`에서 추론된 정확한 타입을 지정합니다.
    - 서비스 메서드의 파라미터와 반환 값에 `Post`, `CreatePostDto` 등 명확한 타입을 선언합니다.
  - **참고 파일:** `review-cursor.md` (1. any 타입 사용 금지 원칙 위반)

- [ ] **2. `Posts` 컨트롤러에 Zod 데코레이터 적용**
  - **설명:** `posts.controller.ts`의 CUD(Create, Update, Delete) 작업을 처리하는 메서드에 `@ZodBody`, `@ZodQuery`, `@ZodParam` 데코레이터를 추가하여 런타임 유효성 검사를 활성화합니다.
  - **조치:** `@Post()` 메서드에 `@ZodBody(CreatePostSchema)`를 추가하는 등 PRD 규칙을 적용합니다.
  - **참고 파일:** `review-cursor.md` (3. 컨트롤러 레이어 패턴 위반)

---

## 🟡 Priority 2: 구조적 개선 (아키텍처 일관성 확보)

*프로젝트의 장기적인 유지보수성과 확장성을 위해 아키텍처의 일관성을 바로잡는 작업들입니다.*

- [ ] **3. `Single Source of Truth` 원칙 위반 수정**
  - **설명:** 스키마 파일에 직접 정의된 `interface`와 `type` 별칭을 제거하고, 올바른 위치로 이동시킵니다.
  - **조치:**
    - `src/schemas/dto/comment.dto.schema.ts`의 `CommentTreeNode` 인터페이스를 Zod 스키마 재귀(recursive) 정의 방식으로 변경합니다.
    - 모든 `schemas/master/*.schema.ts` 파일에 정의된 `export type ... = z.infer<...>` 구문을 해당 엔티티의 `types/entities/*.types.ts` 파일로 이동시킵니다.
  - **참고 파일:** `review-cursor.md` (2. Single Source of Truth 원칙 위반)

- [ ] **4. `CommentMapper` 역할 분리 리팩토링**
  - **설명:** `CommentMapper`에 포함된 비즈니스 로직을 `CommentsService`로 이전하여 각 레이어의 역할을 명확히 분리합니다.
  - **조치:**
    - `buildCommentTree`, `buildCommentThread` 등 댓글 계층 구조 생성 로직을 `CommentsService`로 이동합니다.
    - `isCommentEditable`, `isCommentDeletable` 등 비즈니스 규칙 판단 로직을 `CommentsService`로 이동합니다.
  - **참고 파일:** `review-gemini.md` (2.1. `CommentMapper`의 역할 범위)

---

## 🟢 Priority 3: 기능 구현 및 코드 품질 향상

*기능 명세를 충족시키고 코드의 완성도를 높이는 작업들입니다.*

- [ ] **5. 미구현 API 엔드포인트 개발**
  - **설명:** PRD에 명시되었으나 아직 구현되지 않은 API를 개발합니다.
  - **조치:**
    - `POST /posts/:id/like`: 게시물 좋아요/취소 기능 구현.
    - `POST /auth/logout`: 서버 측 로그아웃(예: Refresh Token 무효화) 기능 구현.
  - **참고 파일:** `review-gemini.md` (3.1. 일부 API 엔드포인트 미구현)

- [ ] **6. `BaseModel` 코드 개선**
  - **설명:** `src/models/base.model.ts`의 `id` getter에서 불필요한 옵셔널 체이닝(`?`)을 제거합니다.
  - **조치:** `this._id?.toHexString()`을 `this._id.toHexString()`으로 수정하여 코드의 명확성을 높입니다.
  - **참고 파일:** `review-gemini.md` (4.1. `BaseModel`의 id Getter 개선)

