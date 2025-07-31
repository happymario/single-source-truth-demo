import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserModel, UserDocument } from '../../models/user.model';
import { CreateUserDto } from '../../types/dto/user.dto.types';

// bcrypt 모킹
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let model: jest.Mocked<Model<UserDocument>>;

  // 테스트용 데이터
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'Test@1234Hash',
    name: 'Test User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'Test@1234',
    name: 'Test User',
    role: 'user',
    isActive: true,
  };

  beforeEach(async () => {
    const mockModel = jest.fn().mockImplementation((dto) => ({
      ...mockUser,
      ...dto,
      save: jest.fn().mockResolvedValue(mockUser),
    }));
    
    // Add static methods to the constructor function
    mockModel.findOne = jest.fn();
    mockModel.findById = jest.fn();
    mockModel.find = jest.fn();
    mockModel.countDocuments = jest.fn();
    mockModel.findByIdAndUpdate = jest.fn();
    mockModel.findByIdAndDelete = jest.fn();
    mockModel.exec = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(UserModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(
      getModelToken(UserModel.name),
    ) as jest.Mocked<Model<UserDocument>>;

    // bcrypt 모킹 설정
    mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('새 사용자를 성공적으로 생성해야 함', async () => {
      // Given
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      model.findOne.mockResolvedValue(null);

      // When
      const result = await service.create(mockCreateUserDto);

      // Then
      expect(model.findOne).toHaveBeenCalledWith({
        email: mockCreateUserDto.email.toLowerCase(),
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        mockCreateUserDto.password,
        12,
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', mockCreateUserDto.email);
      expect(result).not.toHaveProperty('password');
    });

    it('이메일이 이미 존재하면 ConflictException을 던져야 함', async () => {
      // Given
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // When & Then
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(model.findOne).toHaveBeenCalledWith({
        email: mockCreateUserDto.email.toLowerCase(),
      });
    });
  });

  describe('findOne', () => {
    it('ID로 사용자를 찾아야 함', async () => {
      // Given
      const userId = '507f1f77bcf86cd799439011';
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // When
      const result = await service.findOne(userId);

      // Then
      expect(model.findById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('사용자를 찾지 못하면 NotFoundException을 던져야 함', async () => {
      // Given
      const userId = '507f1f77bcf86cd799439011';
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // When & Then
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아야 함 (비밀번호 포함)', async () => {
      // Given
      const email = 'test@example.com';
      const mockUserWithPassword = { ...mockUser, password: 'hashedPassword' };

      model.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUserWithPassword),
        }),
      } as any);

      // When
      const result = await service.findByEmail(email);

      // Then
      expect(model.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
      });
      expect(result).toHaveProperty('password');
    });
  });

  describe('remove', () => {
    it('사용자를 소프트 삭제해야 함', async () => {
      // Given
      const userId = '507f1f77bcf86cd799439011';
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      // When
      await service.remove(userId);

      // Then
      expect(model.findById).toHaveBeenCalledWith(userId);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
    });

    it('사용자를 찾지 못하면 NotFoundException을 던져야 함', async () => {
      // Given
      const userId = '507f1f77bcf86cd799439011';
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // When & Then
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(model.findById).toHaveBeenCalledWith(userId);
    });
  });
});
