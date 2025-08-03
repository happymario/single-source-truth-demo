import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
// bcrypt를 jest.mock으로 모킹
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { AuthService } from './auth.service';
import { UserModel, UserDocument } from '../../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;

  // Mock data
  const mockUser = {
    _id: new Types.ObjectId(),
    id: new Types.ObjectId().toHexString(),
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function () {
      return {
        id: this.id,
        email: this.email,
        name: this.name,
        role: this.role,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserModel = function (userData: any) {
    const now = new Date();
    const savedData = {
      ...userData,
      _id: new Types.ObjectId(),
      id: new Types.ObjectId().toHexString(),
      createdAt: now,
      updatedAt: now,
      toJSON: function () {
        return {
          id: this.id,
          email: this.email,
          name: this.name,
          role: this.role,
          isActive: this.isActive,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      },
    };

    return {
      ...userData,
      save: jest.fn().mockResolvedValue(savedData),
    };
  };

  mockUserModel.findOne = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();
  mockUserModel.create = jest.fn();
  mockUserModel.save = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken(UserModel.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userModel = module.get<Model<UserDocument>>(getModelToken(UserModel.name));

    // Reset mocks
    jest.clearAllMocks();

    // bcrypt mock setup
    const bcrypt = require('bcrypt');
    bcrypt.hash.mockResolvedValue('hashedPassword123');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('새로운 사용자를 성공적으로 등록해야 한다', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      // 중복 이메일 없음
      (userModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // 사용자 생성 mock
      const mockNewUser = {
        ...mockUser,
        ...registerDto,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          ...registerDto,
        }),
      };

      // userModel constructor mock
      (userModel as any) = jest.fn().mockImplementation(() => mockNewUser);

      // JWT 토큰 생성
      (jwtService.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-token');

      const bcrypt = require('bcrypt');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('중복된 이메일로 등록 시 ConflictException을 발생시켜야 한다', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      // 중복 이메일 존재
      (userModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('유효한 자격증명으로 로그인해야 한다', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      // 사용자 검증 성공
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(mockUser as UserDocument);

      // 마지막 로그인 시간 업데이트
      (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // JWT 토큰 생성
      (jwtService.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(loginDto.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('잘못된 자격증명으로 로그인 시 UnauthorizedException을 발생시켜야 한다', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // 사용자 검증 실패
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('유효한 사용자와 비밀번호를 검증해야 한다', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      (userModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toBe(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('존재하지 않는 사용자의 경우 null을 반환해야 한다', async () => {
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      (userModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('잘못된 비밀번호의 경우 null을 반환해야 한다', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      (userModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('JWT 토큰을 생성해야 한다', () => {
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = service.generateTokens(mockUser as UserDocument);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.tokenType).toBe('Bearer');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('changePassword', () => {
    it('비밀번호를 성공적으로 변경해야 한다', async () => {
      const userId = mockUser.id;
      const changePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123!',
      };

      (userModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newHashedPassword');
      (userModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        12,
      );
    });

    it('현재 비밀번호가 틀린 경우 UnauthorizedException을 발생시켜야 한다', async () => {
      const userId = mockUser.id;
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
      };

      (userModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('존재하지 않는 사용자의 경우 NotFoundException을 발생시켜야 한다', async () => {
      const userId = 'nonexistent';
      const changePasswordDto = {
        currentPassword: 'password',
        newPassword: 'newPassword123!',
      };

      (userModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('refreshTokens', () => {
    it('유효한 리프레시 토큰으로 새 토큰을 발급해야 한다', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (userModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(refreshToken);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('잘못된 리프레시 토큰의 경우 UnauthorizedException을 발생시켜야 한다', async () => {
      const refreshToken = 'invalid-refresh-token';

      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
