import { ApiParam, ApiProperty, ApiQuery } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class UserPaginationDto extends PaginationDto {
  @IsIn(['ASC', 'DESC'])
  @ApiProperty({ enum: ['DESC', 'ASC'], default: 'DESC' })
  order__createdAt: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ name: "where__title", type: "string", required: false })
  where__title?: string;
}