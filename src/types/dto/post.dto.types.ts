import { z } from 'zod';
import {
  CreatePostSchema,
  UpdatePostSchema,
  PublishPostSchema,
  ArchivePostSchema,
  UpdatePostStatsSchema,
  ChangePostStatusSchema,
} from '../../schemas/dto/post.dto.schema';

/**
 * Post DTO 타입들 (z.infer 사용)
 */
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
export type PublishPostDto = z.infer<typeof PublishPostSchema>;
export type ArchivePostDto = z.infer<typeof ArchivePostSchema>;
export type UpdatePostStatsDto = z.infer<typeof UpdatePostStatsSchema>;
export type ChangePostStatusDto = z.infer<typeof ChangePostStatusSchema>;
