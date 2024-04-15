import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class AuthsPaginationDto extends PaginationDto {
  @IsIn(['ASC', 'DESC'])
  @ApiProperty({ enum: ['DESC', 'ASC'], default: 'ASC' })
  order__code: 'ASC' | 'DESC' = 'ASC';
}