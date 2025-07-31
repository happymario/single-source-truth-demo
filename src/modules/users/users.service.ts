import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserModel, UserDocument } from '../../models/user.model';
import { UserMapper } from '../../common/mappers/user.mapper';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserQueryDto,
} from '../../types/dto/user.dto.types';
import {
  UserResponse,
  UserListResponse,
} from '../../types/api/user.response.types';

/**
 * 사용자 서비스
 * 타입 안전한 CRUD 작업 및 비즈니스 로직 처리
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * 사용자 생성
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    // 이메일 중복 검사
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // 사용자 생성
    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await user.save();
    return UserMapper.documentToResponse(savedUser);
  }

  /**
   * 사용자 목록 조회 (페이지네이션 및 필터링)
   */
  async findAll(query: UserQueryDto): Promise<UserListResponse> {
    const { page, limit, sortBy, sortOrder, name, email, role, isActive } =
      query;

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // 대소문자 무시 검색
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // 정렬 옵션
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 데이터 조회
    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter),
    ]);

    // 응답 데이터 구성
    const data = UserMapper.documentsToResponses(users);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * ID로 사용자 조회
   */
  async findOne(id: string): Promise<UserResponse> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return UserMapper.documentToResponse(user);
  }

  /**
   * 이메일로 사용자 조회 (인증용, 비밀번호 포함)
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password') // 비밀번호 포함하여 조회
      .exec();
  }

  /**
   * 사용자 정보 수정
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 이메일 변경 시 중복 검사
    if (
      updateUserDto.email &&
      updateUserDto.email !== (user as { email: string }).email
    ) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // 데이터 업데이트
    const updateData: Record<string, unknown> = { ...updateUserDto };
    if (typeof updateData.email === 'string') {
      updateData.email = updateData.email.toLowerCase();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    return UserMapper.documentToResponse(updatedUser!);
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userModel.findById(id).select('+password').exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // 새 비밀번호 해싱
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // 비밀번호 업데이트
    await this.userModel
      .findByIdAndUpdate(id, { password: hashedNewPassword })
      .exec();
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLoginAt(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() })
      .exec();
  }

  /**
   * 사용자 삭제 (소프트 삭제 - 비활성화)
   */
  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 소프트 삭제 (계정 비활성화)
    await this.userModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }

  /**
   * 사용자 완전 삭제 (하드 삭제)
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
