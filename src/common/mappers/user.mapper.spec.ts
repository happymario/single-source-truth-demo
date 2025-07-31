import { UserMapper } from './user.mapper';
import { UserDocument } from '../../models/user.model';

describe('UserMapper', () => {
  // 테스트용 Document 목킹
  const mockUserDocument = {
    _id: { toHexString: () => '507f1f77bcf86cd799439011' },
    email: 'test@example.com',
    password: 'Test@1234Hash',
    name: 'Test User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'Test@1234Hash',
      name: 'Test User',
      role: 'user',
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-02T00:00:00.000Z'),
    }),
  } as unknown as UserDocument;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'Test@1234Hash',
    name: 'Test User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toEntity', () => {
    it('Document를 User 엔티티로 변환해야 함', () => {
      // When
      const result = UserMapper.toEntity(mockUserDocument);

      // Then
      expect(mockUserDocument.toJSON).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('name', 'Test User');
      expect(result).toHaveProperty('password', 'Test@1234Hash');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('Document가 null이면 에러를 던져야 함', () => {
      // When & Then
      expect(() =>
        UserMapper.toEntity(null as unknown as UserDocument),
      ).toThrow('Document is required');
    });
  });

  describe('toResponse', () => {
    it('User 엔티티를 UserResponse로 변환해야 함 (password 제외)', () => {
      // When
      const result = UserMapper.toResponse(mockUser);

      // Then
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('name', 'Test User');
      expect(result).not.toHaveProperty('password'); // 비밀번호는 제외되어야 함
    });
  });

  describe('documentToResponse', () => {
    it('Document를 직접 UserResponse로 변환해야 함', () => {
      // When
      const result = UserMapper.documentToResponse(mockUserDocument);

      // Then
      expect(mockUserDocument.toJSON).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('name', 'Test User');
      expect(result).not.toHaveProperty('password'); // 비밀번호는 제외되어야 함
    });

    it('Document가 null이면 에러를 던져야 함', () => {
      // When & Then
      expect(() =>
        UserMapper.documentToResponse(null as unknown as UserDocument),
      ).toThrow('Document is required');
    });
  });

  describe('toEntities', () => {
    it('Document 배열을 User 엔티티 배열로 변환해야 함', () => {
      // Given
      const documents = [mockUserDocument, mockUserDocument];

      // When
      const result = UserMapper.toEntities(documents);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[1]).toHaveProperty('id', '507f1f77bcf86cd799439011');
    });
  });

  describe('documentsToResponses', () => {
    it('Document 배열을 UserResponse 배열로 변환해야 함', () => {
      // Given
      const documents = [mockUserDocument, mockUserDocument];

      // When
      const result = UserMapper.documentsToResponses(documents);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result[1]).not.toHaveProperty('password');
    });
  });
});
