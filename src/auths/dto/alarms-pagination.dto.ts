import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class AlarmsPaginationDto extends PaginationDto {
  @IsIn(['ASC', 'DESC'])
  @ApiProperty({ enum: ['DESC', 'ASC'], default: 'DESC' })
  order__createdAt: 'ASC' | 'DESC' = 'DESC';

}