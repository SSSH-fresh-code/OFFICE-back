import { IsNumber, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePostsDto {
  @Length(2, 100, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "Next.js 사용하기"
  })
  title: string;

  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "설명"
  })
  description: string;

  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "## 모르겠어"
  })
  contents: string;

  @IsNumber()
  topicId: number;

  @IsOptional()
  seriesId?: number;
}
