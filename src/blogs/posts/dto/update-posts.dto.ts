import { IsNumber, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { CreatePostsDto } from "./create-posts.dto";

export class UpdatePostsDto extends CreatePostsDto {
  @IsNumber()
  id: number;
}
