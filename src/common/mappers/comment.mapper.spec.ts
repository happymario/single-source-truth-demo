import { CommentMapper } from './comment.mapper';
import { CommentDocument } from '../../models/comment.model';
import { UserDocument } from '../../models/user.model';
import { Types } from 'mongoose';

describe('CommentMapper - 계층 구조 테스트', () => {
  // 테스트용 Mock Document 생성 헬퍼
  const createMockCommentDocument = (
    id: string,
    content: string,
    authorId: string,
    postId: string,
    parentId: string | null = null,
    depth = 0,
    path: string[] = [],
    childIds: string[] = [],
    createdAt = new Date(),
  ): CommentDocument => {
    return {
      id,
      _id: new Types.ObjectId(id),
      content,
      authorId,
      postId,
      parentId,
      depth,
      path,
      childIds,
      status: 'active' as const,
      likeCount: 0,
      reportCount: 0,
      isEdited: false,
      isDeleted: false,
      deletedAt: null,
      mentionedUserIds: [],
      metadata: { editHistory: [] },
      createdAt,
      updatedAt: createdAt,
      toJSON: function() {
        return {
          id: this.id,
          content: this.content,
          authorId: this.authorId,
          postId: this.postId,
          parentId: this.parentId,
          depth: this.depth,
          path: this.path,
          childIds: this.childIds,
          status: this.status,
          likeCount: this.likeCount,
          reportCount: this.reportCount,
          isEdited: this.isEdited,
          isDeleted: this.isDeleted,
          deletedAt: this.deletedAt,
          mentionedUserIds: this.mentionedUserIds,
          metadata: this.metadata,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      },
    } as CommentDocument;
  };

  const createMockUserDocument = (id: string, name: string): UserDocument => {
    return {
      id,
      _id: new Types.ObjectId(id),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      role: 'user' as const,
      avatar: `https://example.com/avatar/${id}.jpg`,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: function() {
        return {
          id: this.id,
          name: this.name,
          email: this.email,
          role: this.role,
          avatar: this.avatar,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      },
    } as UserDocument;
  };

  describe('buildCommentPath', () => {
    it('부모 댓글이 없으면 빈 배열을 반환해야 한다', () => {
      const result = CommentMapper.buildCommentPath(null);
      expect(result).toEqual([]);
    });

    it('부모 댓글이 있으면 경로에 부모 ID를 추가해야 한다', () => {
      const parentId = new Types.ObjectId().toHexString();
      const grandParentId = new Types.ObjectId().toHexString();
      
      const parentComment = createMockCommentDocument(
        parentId,
        '부모 댓글',
        'author1',
        'post1',
        grandParentId,
        1,
        [grandParentId], // 할아버지 댓글의 경로
      );

      const result = CommentMapper.buildCommentPath(parentComment);
      
      expect(result).toEqual([grandParentId, parentId]);
    });

    it('깊은 계층 구조에서 올바른 경로를 생성해야 한다', () => {
      const ids = [
        new Types.ObjectId().toHexString(), // level 0
        new Types.ObjectId().toHexString(), // level 1
        new Types.ObjectId().toHexString(), // level 2
        new Types.ObjectId().toHexString(), // level 3
      ];

      const level3Comment = createMockCommentDocument(
        ids[3],
        'Level 3 댓글',
        'author1',
        'post1',
        ids[2],
        3,
        [ids[0], ids[1], ids[2]], // level 0, 1, 2의 경로
      );

      const result = CommentMapper.buildCommentPath(level3Comment);
      
      expect(result).toEqual([ids[0], ids[1], ids[2], ids[3]]);
    });
  });

  describe('calculateDepth', () => {
    it('부모 댓글이 없으면 깊이 0을 반환해야 한다', () => {
      const result = CommentMapper.calculateDepth(null);
      expect(result).toBe(0);
    });

    it('부모 댓글의 깊이 + 1을 반환해야 한다', () => {
      const parentComment = createMockCommentDocument(
        new Types.ObjectId().toHexString(),
        '부모 댓글',
        'author1',
        'post1',
        null,
        2, // 부모의 깊이가 2
      );

      const result = CommentMapper.calculateDepth(parentComment);
      expect(result).toBe(3);
    });

    it('최대 깊이 5를 초과하지 않아야 한다', () => {
      const parentComment = createMockCommentDocument(
        new Types.ObjectId().toHexString(),
        '깊이 5 댓글',
        'author1',
        'post1',
        null,
        5, // 이미 최대 깊이
      );

      const result = CommentMapper.calculateDepth(parentComment);
      expect(result).toBe(5); // 5를 유지해야 함
    });
  });

  describe('buildCommentTree', () => {
    it('빈 댓글 배열에 대해 빈 트리를 반환해야 한다', () => {
      const result = CommentMapper.buildCommentTree([]);
      expect(result).toEqual([]);
    });

    it('단일 루트 댓글에 대해 올바른 트리를 생성해야 한다', () => {
      const commentId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const rootComment = createMockCommentDocument(
        commentId,
        '루트 댓글',
        authorId,
        postId,
      );

      const result = CommentMapper.buildCommentTree([rootComment]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(commentId);
      expect(result[0].content).toBe('루트 댓글');
      expect(result[0].children).toEqual([]);
      expect(result[0].isRoot).toBe(true);
    });

    it('계층 구조 댓글들에 대해 올바른 트리를 생성해야 한다', () => {
      const rootId = new Types.ObjectId().toHexString();
      const child1Id = new Types.ObjectId().toHexString();
      const child2Id = new Types.ObjectId().toHexString();
      const grandChild1Id = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const rootComment = createMockCommentDocument(
        rootId,
        '루트 댓글',
        authorId,
        postId,
        null,
        0,
        [],
        [child1Id, child2Id],
      );

      const child1Comment = createMockCommentDocument(
        child1Id,
        '첫 번째 답글',
        authorId,
        postId,
        rootId,
        1,
        [rootId],
        [grandChild1Id],
      );

      const child2Comment = createMockCommentDocument(
        child2Id,
        '두 번째 답글',
        authorId,
        postId,
        rootId,
        1,
        [rootId],
        [],
      );

      const grandChild1Comment = createMockCommentDocument(
        grandChild1Id,
        '대답글',
        authorId,
        postId,
        child1Id,
        2,
        [rootId, child1Id],
        [],
      );

      const comments = [rootComment, child1Comment, child2Comment, grandChild1Comment];
      const result = CommentMapper.buildCommentTree(comments);

      expect(result).toHaveLength(1);
      
      const tree = result[0];
      expect(tree.id).toBe(rootId);
      expect(tree.children).toHaveLength(2);
      
      const firstChild = tree.children[0];
      expect(firstChild.id).toBe(child1Id);
      expect(firstChild.children).toHaveLength(1);
      expect(firstChild.children[0].id).toBe(grandChild1Id);
      
      const secondChild = tree.children[1];
      expect(secondChild.id).toBe(child2Id);
      expect(secondChild.children).toHaveLength(0);
    });

    it('작성자 정보를 포함한 트리를 생성할 수 있어야 한다', () => {
      const commentId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const comment = createMockCommentDocument(
        commentId,
        '테스트 댓글',
        authorId,
        postId,
      );

      const author = createMockUserDocument(authorId, '테스트 사용자');
      const authorMap = new Map([[authorId, author]]);

      const result = CommentMapper.buildCommentTree([comment], authorMap);

      expect(result).toHaveLength(1);
      expect(result[0].author).toBeDefined();
      expect(result[0].author?.name).toBe('테스트 사용자');
    });

    it('여러 루트 댓글들을 올바르게 처리해야 한다', () => {
      const root1Id = new Types.ObjectId().toHexString();
      const root2Id = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const root1Comment = createMockCommentDocument(
        root1Id,
        '첫 번째 루트 댓글',
        authorId,
        postId,
      );

      const root2Comment = createMockCommentDocument(
        root2Id,
        '두 번째 루트 댓글',
        authorId,
        postId,
      );

      const result = CommentMapper.buildCommentTree([root1Comment, root2Comment]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(root1Id);
      expect(result[1].id).toBe(root2Id);
    });
  });

  describe('buildCommentThread', () => {
    it('빈 댓글 배열에 대해 빈 스레드를 반환해야 한다', () => {
      const result = CommentMapper.buildCommentThread([]);
      expect(result).toEqual([]);
    });

    it('댓글들을 깊이 순으로 정렬해야 한다', () => {
      const rootId = new Types.ObjectId().toHexString();
      const child1Id = new Types.ObjectId().toHexString();
      const grandChild1Id = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      // 순서를 뒤섞어서 생성
      const grandChild = createMockCommentDocument(
        grandChild1Id,
        '대답글',
        authorId,
        postId,
        child1Id,
        2,
        [rootId, child1Id],
        [],
        new Date('2023-01-03'),
      );

      const root = createMockCommentDocument(
        rootId,
        '루트 댓글',
        authorId,
        postId,
        null,
        0,
        [],
        [child1Id],
        new Date('2023-01-01'),
      );

      const child = createMockCommentDocument(
        child1Id,
        '답글',
        authorId,
        postId,
        rootId,
        1,
        [rootId],
        [grandChild1Id],
        new Date('2023-01-02'),
      );

      const comments = [grandChild, root, child]; // 의도적으로 순서 뒤섞음
      const result = CommentMapper.buildCommentThread(comments);

      expect(result).toHaveLength(3);
      expect(result[0].depth).toBe(0); // 루트 댓글
      expect(result[1].depth).toBe(1); // 답글
      expect(result[2].depth).toBe(2); // 대답글
    });

    it('같은 깊이에서는 생성일시 순으로 정렬해야 한다', () => {
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const comment1 = createMockCommentDocument(
        new Types.ObjectId().toHexString(),
        '두 번째 댓글',
        authorId,
        postId,
        null,
        0,
        [],
        [],
        new Date('2023-01-02'),
      );

      const comment2 = createMockCommentDocument(
        new Types.ObjectId().toHexString(),
        '첫 번째 댓글',
        authorId,
        postId,
        null,
        0,
        [],
        [],
        new Date('2023-01-01'),
      );

      const comments = [comment1, comment2]; // 의도적으로 순서 뒤섞음
      const result = CommentMapper.buildCommentThread(comments);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('첫 번째 댓글'); // 더 이른 시간
      expect(result[1].content).toBe('두 번째 댓글'); // 더 늦은 시간
    });

    it('스레드 응답에 올바른 메타데이터가 포함되어야 한다', () => {
      const rootId = new Types.ObjectId().toHexString();
      const childId = new Types.ObjectId().toHexString();
      const authorId = new Types.ObjectId().toHexString();
      const postId = new Types.ObjectId().toHexString();

      const root = createMockCommentDocument(
        rootId,
        '루트 댓글',
        authorId,
        postId,
        null,
        0,
        [],
        [childId],
      );

      const child = createMockCommentDocument(
        childId,
        '답글',
        authorId,
        postId,
        rootId,
        1,
        [rootId],
        [],
      );

      const result = CommentMapper.buildCommentThread([root, child]);

      expect(result).toHaveLength(2);
      
      const rootThread = result[0];
      expect(rootThread.depth).toBe(0);
      expect(rootThread.parentId).toBeNull();
      expect(rootThread.isRoot).toBe(true);
      expect(rootThread.hasChildren).toBe(true);
      
      const childThread = result[1];
      expect(childThread.depth).toBe(1);
      expect(childThread.parentId).toBe(rootId);
      expect(childThread.isRoot).toBe(false);
      expect(childThread.hasChildren).toBe(false);
    });
  });

  describe('댓글 편집/삭제 가능 여부 확인', () => {
    describe('isCommentEditable', () => {
      it('본인 댓글이고 시간 제한 내라면 편집 가능해야 한다', () => {
        const authorId = 'user123';
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '테스트 댓글',
          authorId,
          'post1',
          null,
          0,
          [],
          [],
          new Date(Date.now() - 1000 * 60 * 10), // 10분 전
        );

        const result = CommentMapper.isCommentEditable(comment, authorId, 1 * 60 * 60 * 1000); // 1시간 제한
        expect(result).toBe(true);
      });

      it('다른 사용자의 댓글은 편집할 수 없어야 한다', () => {
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '다른 사용자 댓글',
          'other-user',
          'post1',
        );

        const result = CommentMapper.isCommentEditable(comment, 'current-user');
        expect(result).toBe(false);
      });

      it('시간 제한을 초과한 댓글은 편집할 수 없어야 한다', () => {
        const authorId = 'user123';
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '오래된 댓글',
          authorId,
          'post1',
          null,
          0,
          [],
          [],
          new Date(Date.now() - 1000 * 60 * 60 * 25), // 25시간 전
        );

        const result = CommentMapper.isCommentEditable(comment, authorId, 24 * 60 * 60 * 1000); // 24시간 제한
        expect(result).toBe(false);
      });

      it('이미 삭제된 댓글은 편집할 수 없어야 한다', () => {
        const authorId = 'user123';
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '삭제된 댓글',
          authorId,
          'post1',
        );
        comment.isDeleted = true;

        const result = CommentMapper.isCommentEditable(comment, authorId);
        expect(result).toBe(false);
      });
    });

    describe('isCommentDeletable', () => {
      it('본인 댓글이고 삭제되지 않았다면 삭제 가능해야 한다', () => {
        const authorId = 'user123';
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '테스트 댓글',
          authorId,
          'post1',
        );

        const result = CommentMapper.isCommentDeletable(comment, authorId);
        expect(result).toBe(true);
      });

      it('다른 사용자의 댓글은 삭제할 수 없어야 한다', () => {
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '다른 사용자 댓글',
          'other-user',
          'post1',
        );

        const result = CommentMapper.isCommentDeletable(comment, 'current-user');
        expect(result).toBe(false);
      });

      it('이미 삭제된 댓글은 다시 삭제할 수 없어야 한다', () => {
        const authorId = 'user123';
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '이미 삭제된 댓글',
          authorId,
          'post1',
        );
        comment.isDeleted = true;

        const result = CommentMapper.isCommentDeletable(comment, authorId);
        expect(result).toBe(false);
      });

      it('자식 댓글이 있어도 삭제 가능해야 한다 (소프트 삭제)', () => {
        const authorId = 'user123';
        const childId = new Types.ObjectId().toHexString();
        const comment = createMockCommentDocument(
          new Types.ObjectId().toHexString(),
          '부모 댓글',
          authorId,
          'post1',
          null,
          0,
          [],
          [childId], // 자식이 있음
        );

        const result = CommentMapper.isCommentDeletable(comment, authorId);
        expect(result).toBe(true); // 소프트 삭제이므로 가능
      });
    });
  });
});