import { z } from 'zod';
import validator from 'validator';
import { ObjectIdSchema, TimestampsSchema } from '../shared/common.schema';

/**
 * Comment 마스터 스키마
 * 게시물 댓글 및 대댓글(자기 참조) 구조
 */
export const CommentMasterSchema = z
  .object({
    /**
     * 댓글 고유 식별자
     */
    id: ObjectIdSchema,

    /**
     * 댓글 내용 (1-1000자)
     */
    content: z
      .string()
      .refine(
        (val) => validator.isLength(val, { min: 1, max: 1000 }),
        'Comment content must be 1-1000 characters long',
      ),

    /**
     * 작성자 ID (User 참조)
     */
    authorId: ObjectIdSchema,

    /**
     * 게시물 ID (Post 참조)
     */
    postId: ObjectIdSchema,

    /**
     * 부모 댓글 ID (자기 참조, 대댓글인 경우)
     */
    parentId: ObjectIdSchema.nullable().optional(),

    /**
     * 댓글 깊이 (0: 최상위 댓글, 1+: 대댓글)
     */
    depth: z.number().int().min(0).max(5).default(0),

    /**
     * 자식 댓글 ID 배열 (역참조)
     */
    childIds: z.array(ObjectIdSchema).default([]),

    /**
     * 댓글 경로 (계층 구조 탐색용)
     * 예: ["parent_id", "current_id"]
     */
    path: z.array(ObjectIdSchema).default([]),

    /**
     * 댓글 상태
     */
    status: z.enum(['active', 'edited', 'deleted']).default('active'),

    /**
     * 좋아요 수
     */
    likeCount: z.number().int().min(0).default(0),

    /**
     * 신고 횟수
     */
    reportCount: z.number().int().min(0).default(0),

    /**
     * 수정 여부
     */
    isEdited: z.boolean().default(false),

    /**
     * 삭제 여부 (soft delete)
     */
    isDeleted: z.boolean().default(false),

    /**
     * 삭제 일시 (soft delete)
     */
    deletedAt: z.date().nullable().optional(),

    /**
     * 멘션된 사용자 ID 배열
     */
    mentionedUserIds: z.array(ObjectIdSchema).default([]),

    /**
     * 댓글 메타데이터
     */
    metadata: z
      .object({
        /**
         * IP 주소 (보안용, 해시화)
         */
        ipHash: z.string().optional(),

        /**
         * 사용자 에이전트
         */
        userAgent: z.string().optional(),

        /**
         * 수정 이력
         */
        editHistory: z
          .array(
            z.object({
              editedAt: z.date(),
              previousContent: z.string(),
            }),
          )
          .default([]),
      })
      .optional(),
  })
  .merge(TimestampsSchema);

/**
 * CommentMasterSchema 타입 추론
 */
export type CommentMaster = z.infer<typeof CommentMasterSchema>;