import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ZodBody, ZodQuery } from '../../common/decorators';
import { ApiParamFromZod, ApiQueryFromZod } from '../../common/decorators/swagger-helpers.decorator';
import { ObjectIdSchema } from '../../schemas/shared/common.schema';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
} from '../../schemas/dto/user.dto.schema';
import { UserQuerySchema } from '../../schemas/query/user.query.schema';
import type {
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
 * 사용자 컨트롤러
 * Zod 스키마를 활용한 타입 안전한 API 엔드포인트
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자 생성
   * POST /users
   */
  @Post()
  @ZodBody(CreateUserSchema)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  /**
   * 사용자 목록 조회 (페이지네이션, 필터링, 검색)
   * GET /users?page=1&limit=10&name=john&role=user
   */
  @Get()
  @ApiQueryFromZod(UserQuerySchema)
  async findAll(
    @ZodQuery(UserQuerySchema) query: UserQueryDto,
  ): Promise<UserListResponse> {
    return this.usersService.findAll(query);
  }

  /**
   * 특정 사용자 조회
   * GET /users/:id
   */
  @Get(':id')
  @ApiParamFromZod('id', ObjectIdSchema)
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.usersService.findOne(id);
  }

  /**
   * 사용자 정보 수정
   * PATCH /users/:id
   */
  @Patch(':id')
  @ApiParamFromZod('id', ObjectIdSchema)
  @ZodBody(UpdateUserSchema)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * 비밀번호 변경
   * PATCH /users/:id/password
   */
  @Patch(':id/password')
  @ApiParamFromZod('id', ObjectIdSchema)
  @ZodBody(ChangePasswordSchema)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.usersService.changePassword(id, changePasswordDto);
  }

  /**
   * 사용자 삭제 (소프트 삭제 - 계정 비활성화)
   * DELETE /users/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.usersService.remove(id);
  }

  /**
   * 사용자 완전 삭제 (하드 삭제)
   * DELETE /users/:id/hard
   */
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id') id: string): Promise<void> {
    // ObjectId 형식 검증
    ObjectIdSchema.parse(id);
    return this.usersService.hardDelete(id);
  }
}
