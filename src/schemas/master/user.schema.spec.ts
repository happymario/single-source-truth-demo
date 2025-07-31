import { UserMasterSchema } from './user.schema';

describe('UserMasterSchema', () => {
  const validUserData = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'Test@1234',
    name: 'Test User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('유효한 데이터', () => {
    it('모든 필수 필드가 있는 유효한 사용자 데이터를 파싱해야 함', () => {
      // When
      const result = UserMasterSchema.parse(validUserData);

      // Then
      expect(result).toEqual(validUserData);
    });

    it('선택적 필드들과 함께 파싱해야 함', () => {
      // Given
      const userWithOptionalFields = {
        ...validUserData,
        bio: 'This is a test bio',
        avatar: 'https://example.com/avatar.jpg',
        lastLoginAt: new Date(),
      };

      // When
      const result = UserMasterSchema.parse(userWithOptionalFields);

      // Then
      expect(result).toEqual(userWithOptionalFields);
    });
  });

  describe('필수 필드 검증', () => {
    it('id가 없으면 검증 실패해야 함', () => {
      // Given
      const invalidData = { ...validUserData };
      delete (invalidData as any).id;

      // When & Then
      expect(() => UserMasterSchema.parse(invalidData)).toThrow();
    });

    it('email이 없으면 검증 실패해야 함', () => {
      // Given
      const invalidData = { ...validUserData };
      delete (invalidData as any).email;

      // When & Then
      expect(() => UserMasterSchema.parse(invalidData)).toThrow();
    });

    it('password가 없으면 검증 실패해야 함', () => {
      // Given
      const invalidData = { ...validUserData };
      delete (invalidData as any).password;

      // When & Then
      expect(() => UserMasterSchema.parse(invalidData)).toThrow();
    });

    it('name이 없으면 검증 실패해야 함', () => {
      // Given
      const invalidData = { ...validUserData };
      delete (invalidData as any).name;

      // When & Then
      expect(() => UserMasterSchema.parse(invalidData)).toThrow();
    });
  });

  describe('이메일 검증', () => {
    it('유효하지 않은 이메일 형식이면 검증 실패해야 함', () => {
      // Given
      const invalidData = {
        ...validUserData,
        email: 'invalid-email',
      };

      // When & Then
      expect(() => UserMasterSchema.parse(invalidData)).toThrow();
    });

    it('유효한 이메일 형식이면 통과해야 함', () => {
      // Given
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.kr',
        'user+tag@example.org',
      ];

      // When & Then
      validEmails.forEach(email => {
        const userData = { ...validUserData, email };
        expect(() => UserMasterSchema.parse(userData)).not.toThrow();
      });
    });
  });

  describe('비밀번호 검증', () => {
    it('약한 비밀번호면 검증 실패해야 함', () => {
      // Given
      const weakPasswords = [
        '123456',           // 너무 짧고 단순
        'password',         // 소문자만
        'PASSWORD',         // 대문자만
        'Password',         // 숫자 없음
        'Password123',      // 특수문자 없음
      ];

      // When & Then
      weakPasswords.forEach(password => {
        const userData = { ...validUserData, password };
        expect(() => UserMasterSchema.parse(userData)).toThrow();
      });
    });

    it('강한 비밀번호면 통과해야 함', () => {
      // Given
      const strongPasswords = [
        'Test@1234',
        'MyStr0ng!Pass',
        'C0mpl3x#P@ssw0rd',
      ];

      // When & Then
      strongPasswords.forEach(password => {
        const userData = { ...validUserData, password };
        expect(() => UserMasterSchema.parse(userData)).not.toThrow();
      });
    });
  });

  describe('이름 검증', () => {
    it('빈 이름이면 검증 실패해야 함', () => {
      // Given
      const userData = { ...validUserData, name: '' };

      // When & Then
      expect(() => UserMasterSchema.parse(userData)).toThrow();
    });

    it('너무 긴 이름이면 검증 실패해야 함', () => {
      // Given
      const userData = { ...validUserData, name: 'a'.repeat(51) };

      // When & Then
      expect(() => UserMasterSchema.parse(userData)).toThrow();
    });
  });

  describe('역할 검증', () => {
    it('유효하지 않은 역할이면 검증 실패해야 함', () => {
      // Given
      const userData = { ...validUserData, role: 'invalid' as any };

      // When & Then
      expect(() => UserMasterSchema.parse(userData)).toThrow();
    });

    it('유효한 역할이면 통과해야 함', () => {
      // Given
      const validRoles = ['user', 'admin'] as const;

      // When & Then
      validRoles.forEach(role => {
        const userData = { ...validUserData, role };
        expect(() => UserMasterSchema.parse(userData)).not.toThrow();
      });
    });
  });

  describe('ObjectId 검증', () => {
    it('유효하지 않은 ObjectId 형식이면 검증 실패해야 함', () => {
      // Given
      const invalidIds = [
        'invalid',
        '123',
        '507f1f77bcf86cd79943901',  // 너무 짧음
        '507f1f77bcf86cd79943901g', // 유효하지 않은 문자
      ];

      // When & Then
      invalidIds.forEach(id => {
        const userData = { ...validUserData, id };
        expect(() => UserMasterSchema.parse(userData)).toThrow();
      });
    });

    it('유효한 ObjectId 형식이면 통과해야 함', () => {
      // Given
      const validIds = [
        '507f1f77bcf86cd799439011',
        '61234567890abcdef1234567',
      ];

      // When & Then
      validIds.forEach(id => {
        const userData = { ...validUserData, id };
        expect(() => UserMasterSchema.parse(userData)).not.toThrow();
      });
    });
  });
});