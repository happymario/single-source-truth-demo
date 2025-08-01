# 개발 작업 목록 (우선순위 순)

이 문서는 `review-cursor.md`와 `review-gemini.md`의 교차 검증 결과를 바탕으로 생성된 실행 가능한 개발 작업 목록입니다.

---

## 🔴 Priority 1: 즉시 수정 (블로커 해소)

*PRD의 핵심 원칙을 위반하여 타입 안정성을 심각하게 저해하는 문제들입니다. 최우선으로 해결해야 합니다.*

- [ ] **1. `Posts` 모듈 전체 타입 재정의 및 데코레이터 적용**
  - **문제점:** `posts.controller.ts`와 `posts.service.ts`에서 `any` 타입이 광범위하게 사용되고 있으며, `@ZodBody` 등의 데코레이터가 누락되었습니다. (Cursor 지적)
  - **조치:**
    - 컨트롤러와 서비스의 모든 `any` 타입을 `types` 디렉토리에서 추론된 DTO 및 Entity 타입으로 교체합니다.
    - 컨트롤러 메서드에 `@ZodBody`, `@ZodQuery`, `@ZodParam` 데코레이터를 적용하여 런타임 유효성 검사를 활성화합니다.
  - **참고 파일:** `review-cursor.md` (1, 3, 4번 항목)

---

## 🟡 Priority 2: 구조적 개선 (아키텍처 일관성 확보)

*프로젝트의 장기적인 유지보수성과 확장성을 위해 아키텍처의 일관성을 바로잡는 작업들입니다.*

- [ ] **2. `Single Source of Truth` 원칙 위반 수정**
  - **문제점:** 스키마 파일 내에 `interface` 또는 `type` 별칭이 직접 정의되어 있습니다. (Cursor, Gemini 공통 지적)
  - **조치:**
    - `src/schemas/dto/comment.dto.schema.ts`의 `CommentTreeNode` 인터페이스를 Zod의 재귀적 스키마 정의(`z.lazy`)를 사용하여 `types/dto/comment.dto.types.ts`에서 타입으로 추론하도록 수정합니다.
    - 모든 `schemas/master/*.schema.ts` 파일에 존재하는 `export type ... = z.infer<...>` 구문을 해당 엔티티의 `types/entities/*.types.ts` 파일로 이동시킵니다.
  - **참고 파일:** `review-cursor.md` (2번 항목), `review-gemini.md` (2.1 항목)

- [ ] **3. `CommentMapper` 역할 분리 리팩토링**
  - **문제점:** `CommentMapper`에 데이터 변환 외의 비즈니스 로직(트리 구조 생성, 편집/삭제 가능 여부 판단 등)이 포함되어 있습니다. (Gemini 지적)
  - **조치:** 해당 로직들을 `CommentsService`로 이전하여 매퍼는 데이터 변환에만 집중하고, 서비스 레이어가 비즈니스 규칙을 처리하도록 역할을 명확히 분리합니다.
  - **참고 파일:** `review-gemini.md` (2.3 항목)

- [ ] **4. `Comments` 컨트롤러 리팩토링**
  - **문제점:** `comments.controller.ts`에서 `@Body()`, `@Query()` 파라미터에 `unknown` 타입을 사용하고 수동으로 `parse()`를 호출하고 있습니다. (Gemini 지적)
  - **조치:** PRD 패턴에 따라 `@ZodBody`, `@ZodQuery` 데코레이터를 사용하도록 리팩토링하여 코드의 일관성을 높입니다.
  - **참고 파일:** `review-gemini.md` (2.2 항목)

