import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostModel, PostDocument } from '../../models/post.model';
import { UserModel, UserDocument } from '../../models/user.model';
import { CategoryModel, CategoryDocument } from '../../models/category.model';
import { PostMapper } from '../../common/mappers/post.mapper';
import {
  CreatePostDto,
  UpdatePostDto,
  PublishPostDto,
  ChangePostStatusDto,
  UpdatePostStatsDto,
} from '../../types/dto/post.dto.types';
import {
  PostResponse,
  PostListResponse,
  PostWithAuthorResponse,
  PostWithCategoriesResponse,
  PostWithRelationsResponse,
  PostStatsResponse,
} from '../../types/api/post.response.types';
import {
  PostListQuerySchema,
  PostFindQuerySchema,
  PostStatsQuerySchema,
} from '../../schemas/query/post.query.schema';
import { z } from 'zod';

/**
 * 게시물 서비스
 * 타입 안전한 CRUD 작업 및 관계형 데이터 처리
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(PostModel.name) private postModel: Model<PostDocument>,
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
    @InjectModel(CategoryModel.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * 게시물 생성
   */
  async create(createPostDto: CreatePostDto): Promise<PostResponse> {
    // 슬러그 중복 검사
    const existingPost = await this.postModel.findOne({
      slug: createPostDto.slug,
    });

    if (existingPost) {
      throw new ConflictException('Slug already exists');
    }

    // 작성자 존재 확인
    const author = await this.userModel.findById(createPostDto.authorId);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // 카테고리 존재 확인
    if (createPostDto.categoryIds && createPostDto.categoryIds.length > 0) {
      const categoryCount = await this.categoryModel.countDocuments({
        _id: { $in: createPostDto.categoryIds },
      });

      if (categoryCount !== createPostDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
    }

    // 게시물 생성
    const post = new this.postModel(createPostDto);
    const savedPost = await post.save();

    return PostMapper.documentToResponse(savedPost);
  }

  /**
   * 게시물 목록 조회 (페이지네이션, 필터링, 검색)
   */
  async findAll(queryDto: z.infer<typeof PostListQuerySchema>): Promise<PostListResponse> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      authorId,
      categoryId,
      tag,
      status,
      isPublic,
      isFeatured,
      startDate,
      endDate,
    } = queryDto;

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (authorId) {
      filter.authorId = authorId;
    }

    if (categoryId) {
      filter.categoryIds = categoryId;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (status) {
      filter.status = status;
    }

    if (typeof isPublic === 'boolean') {
      filter.isPublic = isPublic;
    }

    if (typeof isFeatured === 'boolean') {
      filter.isFeatured = isFeatured;
    }

    // 날짜 범위 필터
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = startDate;
      }
      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    // 정렬 조건
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 쿼리 실행
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(filter),
    ]);

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      posts: PostMapper.documentsToResponses(posts),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * 게시물 단일 조회 (ID 또는 슬러그)
   */
  async findOne(
    idOrSlug: string,
    queryDto?: z.infer<typeof PostFindQuerySchema>,
  ): Promise<PostResponse | PostWithAuthorResponse | PostWithCategoriesResponse | PostWithRelationsResponse> {
    const { include = [], incrementView = false } = queryDto || {};

    // ID 또는 슬러그로 조회
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    let query = this.postModel.findOne(filter);

    // Populate 옵션 처리
    if (include.includes('author')) {
      query = query.populate('authorId');
    }
    if (include.includes('categories')) {
      query = query.populate('categoryIds');
    }

    const post = await query.exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 조회수 증가
    if (incrementView) {
      await this.postModel.updateOne(
        { _id: post._id },
        { $inc: { viewCount: 1 } },
      );
      post.viewCount += 1;
    }

    // Populate 여부에 따라 적절한 응답 변환
    return PostMapper.populatedDocumentToResponse(post as PostDocument & {
      authorId?: UserDocument;
      categoryIds?: CategoryDocument[];
    });
  }

  /**
   * 게시물 수정
   */
  async update(id: string, updatePostDto: UpdatePostDto): Promise<PostResponse> {
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 슬러그 중복 검사 (슬러그가 변경되는 경우)
    if (updatePostDto.slug && updatePostDto.slug !== post.slug) {
      const existingPost = await this.postModel.findOne({
        slug: updatePostDto.slug,
        _id: { $ne: id },
      });

      if (existingPost) {
        throw new ConflictException('Slug already exists');
      }
    }

    // 카테고리 존재 확인 (카테고리가 변경되는 경우)
    if (updatePostDto.categoryIds && updatePostDto.categoryIds.length > 0) {
      const categoryCount = await this.categoryModel.countDocuments({
        _id: { $in: updatePostDto.categoryIds },
      });

      if (categoryCount !== updatePostDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
    }

    // 게시물 업데이트
    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      updatePostDto,
      { new: true },
    );

    return PostMapper.documentToResponse(updatedPost);
  }

  /**
   * 게시물 상태 변경
   */
  async changeStatus(id: string, statusDto: ChangePostStatusDto): Promise<PostResponse> {
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 발행 상태로 변경하는 경우 publishedAt 설정
    const updateData: Partial<ChangePostStatusDto> = { status: statusDto.status };
    if (statusDto.status === 'published' && !post.publishedAt) {
      updateData.publishedAt = statusDto.publishedAt || new Date();
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    return PostMapper.documentToResponse(updatedPost);
  }

  /**
   * 게시물 통계 업데이트 (내부 사용)
   */
  async updateStats(id: string, statsDto: UpdatePostStatsDto): Promise<PostResponse> {
    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      statsDto,
      { new: true },
    );

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    return PostMapper.documentToResponse(updatedPost);
  }

  /**
   * 게시물 삭제
   */
  async remove(id: string): Promise<void> {
    const result = await this.postModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Post not found');
    }
  }

  /**
   * 작성자별 게시물 조회
   */
  async findByAuthor(
    authorId: string,
    queryDto: z.infer<typeof PostListQuerySchema>,
  ): Promise<PostListResponse> {
    return this.findAll({ ...queryDto, authorId });
  }

  /**
   * 카테고리별 게시물 조회
   */
  async findByCategory(
    categoryId: string,
    queryDto: z.infer<typeof PostListQuerySchema>,
  ): Promise<PostListResponse> {
    return this.findAll({ ...queryDto, categoryId });
  }

  /**
   * 태그별 게시물 조회
   */
  async findByTag(
    tag: string,
    queryDto: z.infer<typeof PostListQuerySchema>,
  ): Promise<PostListResponse> {
    return this.findAll({ ...queryDto, tag });
  }

  /**
   * 인기 게시물 조회
   */
  async findPopular(limit: number = 10): Promise<PostResponse[]> {
    const posts = await this.postModel
      .find({ status: 'published', isPublic: true })
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(limit)
      .exec();

    return PostMapper.documentsToResponses(posts);
  }

  /**
   * 추천 게시물 조회
   */
  async findFeatured(limit: number = 5): Promise<PostResponse[]> {
    const posts = await this.postModel
      .find({ status: 'published', isPublic: true, isFeatured: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();

    return PostMapper.documentsToResponses(posts);
  }

  /**
   * 최근 게시물 조회
   */
  async findRecent(limit: number = 10): Promise<PostResponse[]> {
    const posts = await this.postModel
      .find({ status: 'published', isPublic: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();

    return PostMapper.documentsToResponses(posts);
  }

  /**
   * 게시물 통계 조회
   */
  async getStats(queryDto?: z.infer<typeof PostStatsQuerySchema>): Promise<PostStatsResponse> {
    const { period = 'month', startDate, endDate } = queryDto || {};

    // 기본 통계
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViewsResult,
      totalLikesResult,
      totalCommentsResult,
    ] = await Promise.all([
      this.postModel.countDocuments(),
      this.postModel.countDocuments({ status: 'published' }),
      this.postModel.countDocuments({ status: 'draft' }),
      this.postModel.countDocuments({ status: 'archived' }),
      this.postModel.aggregate([
        { $group: { _id: null, total: { $sum: '$viewCount' } } },
      ]),
      this.postModel.aggregate([
        { $group: { _id: null, total: { $sum: '$likeCount' } } },
      ]),
      this.postModel.aggregate([
        { $group: { _id: null, total: { $sum: '$commentCount' } } },
      ]),
    ]);

    const totalViews = totalViewsResult[0]?.total || 0;
    const totalLikes = totalLikesResult[0]?.total || 0;
    const totalComments = totalCommentsResult[0]?.total || 0;

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalViews,
      totalLikes,
      totalComments,
      averageViewsPerPost: totalPosts > 0 ? totalViews / totalPosts : 0,
      averageLikesPerPost: totalPosts > 0 ? totalLikes / totalPosts : 0,
      averageCommentsPerPost: totalPosts > 0 ? totalComments / totalPosts : 0,
    };
  }
}