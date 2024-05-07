import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { CreatePostsDto } from "./create-posts.dto";

export class UpdatePostsDto extends PartialType(CreatePostsDto) {
  @IsNumber()
  id: number;
}
