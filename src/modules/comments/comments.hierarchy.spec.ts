import { CommentMapper } from '../../common/mappers/comment.mapper';
import { Types } from 'mongoose';

describe('Comment 계층 구조 핵심 기능 테스트', () => {
  describe('CommentMapper - 계층 구조 유틸리티', () => {
    describe('buildCommentPath', () => {
      it('부모가 없으면 빈 배열을 반환해야 한다', () => {
        const result = CommentMapper.buildCommentPath(null);
        expect(result).toEqual([]);
      });

      it('부모 댓글의 경로에 자신의 ID를 추가해야 한다', () => {
        const parentId = new Types.ObjectId().toHexString();
        const grandParentId = new Types.ObjectId().toHexString();

        const mockParent = {
          id: parentId,
          path: [grandParentId], // 할아버지만 있는 경로
        } as any;

        const result = CommentMapper.buildCommentPath(mockParent);
        expect(result).toEqual([grandParentId, parentId]);
      });

      it('깊은 계층에서도 올바른 경로를 생성해야 한다', () => {
        const ids = Array.from({ length: 4 }, () =>
          new Types.ObjectId().toHexString(),
        );

        const mockParent = {
          id: ids[3],
          path: [ids[0], ids[1], ids[2]], // 3단계까지의 경로
        } as any;

        const result = CommentMapper.buildCommentPath(mockParent);
        expect(result).toEqual([ids[0], ids[1], ids[2], ids[3]]);
      });
    });

    describe('calculateDepth', () => {
      it('부모가 없으면 깊이 0을 반환해야 한다', () => {
        const result = CommentMapper.calculateDepth(null);
        expect(result).toBe(0);
      });

      it('부모의 깊이 + 1을 반환해야 한다', () => {
        const mockParent = { depth: 2 } as any;
        const result = CommentMapper.calculateDepth(mockParent);
        expect(result).toBe(3);
      });

      it('최대 깊이 5를 초과하지 않아야 한다', () => {
        const mockParent = { depth: 5 } as any;
        const result = CommentMapper.calculateDepth(mockParent);
        expect(result).toBe(5);
      });

      it('최대 깊이를 넘어서려 하면 5로 제한된다', () => {
        const mockParent = { depth: 10 } as any; // 실제로는 불가능하지만 테스트
        const result = CommentMapper.calculateDepth(mockParent);
        expect(result).toBe(5);
      });
    });

    describe('isCommentEditable', () => {
      const userId = 'user123';
      const now = new Date();

      it('본인 댓글이고 시간 내라면 편집 가능해야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: false,
          createdAt: new Date(now.getTime() - 1000 * 60 * 10), // 10분 전
        } as any;

        const result = CommentMapper.isCommentEditable(
          mockComment,
          userId,
          1000 * 60 * 60, // 1시간 제한
        );

        expect(result).toBe(true);
      });

      it('다른 사용자의 댓글은 편집할 수 없어야 한다', () => {
        const mockComment = {
          authorId: 'other-user',
          isDeleted: false,
          createdAt: new Date(now.getTime() - 1000 * 60 * 10),
        } as any;

        const result = CommentMapper.isCommentEditable(mockComment, userId);
        expect(result).toBe(false);
      });

      it('시간 제한을 초과한 댓글은 편집할 수 없어야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: false,
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 25), // 25시간 전
        } as any;

        const result = CommentMapper.isCommentEditable(
          mockComment,
          userId,
          1000 * 60 * 60 * 24, // 24시간 제한
        );

        expect(result).toBe(false);
      });

      it('삭제된 댓글은 편집할 수 없어야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: true,
          createdAt: new Date(now.getTime() - 1000 * 60 * 10),
        } as any;

        const result = CommentMapper.isCommentEditable(mockComment, userId);
        expect(result).toBe(false);
      });
    });

    describe('isCommentDeletable', () => {
      const userId = 'user123';

      it('본인 댓글이고 삭제되지 않았다면 삭제 가능해야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: false,
        } as any;

        const result = CommentMapper.isCommentDeletable(mockComment, userId);
        expect(result).toBe(true);
      });

      it('다른 사용자의 댓글은 삭제할 수 없어야 한다', () => {
        const mockComment = {
          authorId: 'other-user',
          isDeleted: false,
        } as any;

        const result = CommentMapper.isCommentDeletable(mockComment, userId);
        expect(result).toBe(false);
      });

      it('이미 삭제된 댓글은 다시 삭제할 수 없어야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: true,
        } as any;

        const result = CommentMapper.isCommentDeletable(mockComment, userId);
        expect(result).toBe(false);
      });

      it('자식 댓글이 있어도 소프트 삭제는 가능해야 한다', () => {
        const mockComment = {
          authorId: userId,
          isDeleted: false,
          childIds: ['child1', 'child2'], // 자식이 있음
        } as any;

        const result = CommentMapper.isCommentDeletable(mockComment, userId);
        expect(result).toBe(true); // 소프트 삭제이므로 가능
      });
    });
  });

  describe('계층 구조 로직 검증', () => {
    it('댓글 트리 생성 시 올바른 구조가 만들어져야 한다', () => {
      // Mock 댓글 데이터 생성
      const rootId = new Types.ObjectId().toHexString();
      const child1Id = new Types.ObjectId().toHexString();
      const child2Id = new Types.ObjectId().toHexString();
      const grandChild1Id = new Types.ObjectId().toHexString();

      const mockComments = [
        {
          id: rootId,
          content: '루트 댓글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: null,
          depth: 0,
          path: [],
          childIds: [child1Id, child2Id],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: child1Id,
          content: '첫 번째 답글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: rootId,
          depth: 1,
          path: [rootId],
          childIds: [grandChild1Id],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: child2Id,
          content: '두 번째 답글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: rootId,
          depth: 1,
          path: [rootId],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: grandChild1Id,
          content: '대답글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: child1Id,
          depth: 2,
          path: [rootId, child1Id],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-04'),
          updatedAt: new Date('2023-01-04'),
          toJSON: function () {
            return this;
          },
        },
      ] as any[];

      const tree = CommentMapper.buildCommentTree(mockComments);

      expect(tree).toHaveLength(1); // 루트 댓글 1개

      const root = tree[0];
      expect(root.id).toBe(rootId);
      expect(root.children).toHaveLength(2); // 답글 2개

      const firstChild = root.children[0];
      expect(firstChild.id).toBe(child1Id);
      expect(firstChild.children).toHaveLength(1); // 대답글 1개

      const secondChild = root.children[1];
      expect(secondChild.id).toBe(child2Id);
      expect(secondChild.children).toHaveLength(0); // 대답글 없음

      const grandChild = firstChild.children[0];
      expect(grandChild.id).toBe(grandChild1Id);
      expect(grandChild.children).toHaveLength(0);
    });

    it('댓글 스레드 생성 시 깊이 순으로 정렬되어야 한다', () => {
      const grandChildId = new Types.ObjectId().toHexString();
      const rootId = new Types.ObjectId().toHexString();
      const childId = new Types.ObjectId().toHexString();

      const mockComments = [
        {
          id: grandChildId,
          content: '대답글 (깊이 2)',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          depth: 2,
          parentId: childId,
          path: [rootId, childId],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-04'),
          updatedAt: new Date('2023-01-04'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: rootId,
          content: '루트 댓글 (깊이 0)',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          depth: 0,
          parentId: null,
          path: [],
          childIds: [childId],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: childId,
          content: '답글 (깊이 1)',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          depth: 1,
          parentId: rootId,
          path: [rootId],
          childIds: [grandChildId],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          toJSON: function () {
            return this;
          },
        },
      ] as any[];

      const thread = CommentMapper.buildCommentThread(mockComments);

      expect(thread).toHaveLength(3);

      // 깊이 순으로 정렬되었는지 확인
      expect(thread[0].depth).toBe(0);
      expect(thread[0].content).toBe('루트 댓글 (깊이 0)');

      expect(thread[1].depth).toBe(1);
      expect(thread[1].content).toBe('답글 (깊이 1)');

      expect(thread[2].depth).toBe(2);
      expect(thread[2].content).toBe('대답글 (깊이 2)');
    });

    it('같은 깊이에서는 생성일시 순으로 정렬되어야 한다', () => {
      const mockComments = [
        {
          id: new Types.ObjectId().toHexString(),
          content: '두 번째 댓글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: null,
          depth: 0,
          path: [],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: new Types.ObjectId().toHexString(),
          content: '첫 번째 댓글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: null,
          depth: 0,
          path: [],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          toJSON: function () {
            return this;
          },
        },
        {
          id: new Types.ObjectId().toHexString(),
          content: '세 번째 댓글',
          authorId: new Types.ObjectId().toHexString(),
          postId: new Types.ObjectId().toHexString(),
          parentId: null,
          depth: 0,
          path: [],
          childIds: [],
          status: 'active',
          likeCount: 0,
          reportCount: 0,
          isEdited: false,
          isDeleted: false,
          deletedAt: null,
          mentionedUserIds: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03'),
          toJSON: function () {
            return this;
          },
        },
      ] as any[];

      const thread = CommentMapper.buildCommentThread(mockComments);

      expect(thread).toHaveLength(3);

      // 생성일시 순으로 정렬되었는지 확인
      expect(thread[0].content).toBe('첫 번째 댓글');
      expect(thread[1].content).toBe('두 번째 댓글');
      expect(thread[2].content).toBe('세 번째 댓글');
    });
  });

  describe('경계 값 테스트', () => {
    it('최대 깊이 5에서의 동작을 검증해야 한다', () => {
      // 깊이 4의 부모에서 자식 생성
      const depth4Parent = { depth: 4 } as any;
      const childDepth = CommentMapper.calculateDepth(depth4Parent);
      expect(childDepth).toBe(5);

      // 깊이 5의 부모에서 자식 생성 시도
      const depth5Parent = { depth: 5 } as any;
      const maxChildDepth = CommentMapper.calculateDepth(depth5Parent);
      expect(maxChildDepth).toBe(5); // 여전히 5로 제한
    });

    it('빈 배열 입력에 대한 안전한 처리를 확인해야 한다', () => {
      const emptyTree = CommentMapper.buildCommentTree([]);
      expect(emptyTree).toEqual([]);

      const emptyThread = CommentMapper.buildCommentThread([]);
      expect(emptyThread).toEqual([]);
    });

    it('null/undefined 입력에 대한 안전한 처리를 확인해야 한다', () => {
      const nullPath = CommentMapper.buildCommentPath(null);
      expect(nullPath).toEqual([]);

      const nullDepth = CommentMapper.calculateDepth(null);
      expect(nullDepth).toBe(0);
    });
  });
});
