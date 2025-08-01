# PRD 기반 구현 검토 보고서 (Gemini)

## 1. 전체 평가

- 프로젝트는 PRD에 명시된 **Zod 중심의 Single Source of Truth 아키텍처**를 성공적으로 채택하고 있으며, 코드 전반에 걸쳐 일관성 있게 적용하려는 노력이 보입니다.
- `schemas` → `types` → `models`로 이어지는 타입 추론 및 파생 규칙이 대부분의 모듈에서 잘 준수되고 있습니다.

## 2. PRD 원칙 준수 현황

### 2.1. Single Source of Truth 원칙
- **준수:** 대부분의 Entity, DTO, Response 타입이 `schemas/master`에 정의된 Zod 스키마로부터 `z.infer`를 통해 파생되고 있습니다.
- **개선 필요:**
  - `src/schemas/dto/comment.dto.schema.ts`: `CommentTreeNodeSchema`와 함께 `CommentTreeNode` 인터페이스가 정의되어 있습니다. 이 인터페이스는 `types/dto/comment.dto.types.ts` 파일로 이동하여 `z.infer`로 추론해야 합니다.
  - `src/schemas/master/*.schema.ts`: 스키마 파일 내에 `export type ... = z.infer<...>` 구문이 존재합니다. PRD 원칙에 따라 모든 타입 추론은 `types` 디렉토리 하위에서 이루어져야 합니다.

### 2.2. `any` 타입 사용 금지 원칙
- **준수:** `any` 타입의 직접적인 사용은 대부분의 모듈에서 잘 회피되고 있습니다.
- **개선 필요:** `src/modules/comments/comments.controller.ts`의 메서드들이 `@Body()`, `@Query()` 파라미터에 `unknown` 타입을 사용하고 내부에서 수동으로 `parse()`를 호출합니다. 이는 PRD에서 권장하는 `@ZodBody`, `@ZodQuery` 데코레이터를 사용하여 컨트롤러 레벨에서 타입을 명확히 하는 패턴으로 개선할 수 있습니다.

### 2.3. 아키텍처 및 설계
- **`CommentMapper`의 역할 범위 (개선 필요):**
  - **현상:** `src/common/mappers/comment.mapper.ts` 파일에 `buildCommentTree`, `buildCommentThread`, `isCommentEditable` 등 데이터 변환 이상의 복잡한 비즈니스 로직이 포함되어 있습니다.
  - **권장 사항:** 이는 계층 분리 원칙에 따라 `CommentsService`로 이전하는 것이 바람직합니다. 매퍼는 순수한 데이터 구조 변환에만 집중하고, 서비스는 비즈니스 규칙을 처리하도록 역할을 명확히 분리해야 합니다.

## 3. 미구현 또는 확인 필요 사항

- **`POST /auth/logout`:** `auth.service.ts`의 `logout` 메서드가 실제 Refresh Token을 무효화하는 로직 없이 단순히 성공 메시지만 반환하고 있습니다. 실제 운영을 위해서는 토큰을 블랙리스트에 추가하는 등의 무효화 처리가 필요합니다.

## 4. 결론

프로젝트는 PRD의 핵심 사상을 매우 잘 이해하고 구현하였으나, 일부 영역에서 아키텍처 일관성을 더욱 높일 수 있는 개선점이 존재합니다. 특히 `CommentMapper`의 역할을 재조정하고, 일부 남아있는 타입 정의 위치를 바로잡는다면 PRD의 목표를 완벽하게 달성할 수 있을 것입니다.
