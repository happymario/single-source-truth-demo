# PRD 기반 구현 검토 결과

## 1. 전체 평가

- 프로젝트는 PRD에 명시된 **Zod 중심의 Single Source of Truth 아키텍처**를 매우 성공적으로 구현함.
- `schemas` → `types` → `models`로 이어지는 타입 추론 및 파생 규칙이 코드 전반에 일관되게 적용됨.
- `any` 타입 사용 금지, 계층적 디렉토리 구조 등 핵심 원칙을 잘 준수하고 있음.

## 2. PRD와 구현의 주요 차이점

### 2.1. `CommentMapper`의 역할 범위
- **PRD:** 매퍼(Mapper)는 Document, Entity, Response 간의 순수한 데이터 구조 변환을 담당.
- **구현:** `src/common/mappers/comment.mapper.ts` 파일에 데이터 변환 외의 비즈니스 로직이 포함되어 있음.
  - `buildCommentTree`, `buildCommentThread`: 댓글의 계층 구조를 생성하는 로직.
  - `isCommentEditable`, `isCommentDeletable`: 댓글의 수정/삭제 가능 여부를 판단하는 비즈니스 규칙.
- **권장 사항:** 해당 로직들을 `CommentsService`로 이전하여 매퍼는 데이터 변환에만 집중하고, 서비스 레이어가 비즈니스 규칙을 처리하도록 역할을 명확히 분리하는 것을 권장.

## 3. 미구현 또는 확인 필요 사항

### 3.1. 일부 API 엔드포인트 미구현
PRD의 `API 엔드포인트 설계` 목록 중 다음 기능들의 구체적인 구현이 확인되지 않아 추가 구현이 필요함.

- **게시물 좋아요 기능:**
  - `POST /posts/:id/like`
  - `PostMasterSchema`에 `likeCount` 필드는 존재하지만, 실제 좋아요를 처리하는 서비스 로직 및 컨트롤러 구현이 필요.
- **인증 관련 기능:**
  - `POST /auth/logout`
  - 로그아웃 처리 로직 (예: Refresh Token 무효화) 구현이 필요.

## 4. 코드 개선 제안

### 4.1. `BaseModel`의 `id` Getter 개선
- **현상:** `src/models/base.model.ts`의 `id` getter가 `return this._id?.toHexString();`로 구현되어 있음.
- **문제점:** Mongoose 모델의 `_id`는 항상 존재하므로 옵셔널 체이닝(`?`)이 불필요하며, 코드를 읽는 개발자에게 `_id`가 없을 수도 있다는 오해를 줄 수 있음.
- **개선안:** `return this._id.toHexString();`으로 변경하여 코드의 명확성을 높일 것을 제안.

