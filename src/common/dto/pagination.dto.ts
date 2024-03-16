import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumber({})
  @ApiProperty({ name: "page", type: "number", default: 1 })
  page: number = 1;


  @IsNumber()
  @ApiProperty({ name: "take", type: "number", default: 20 })
  take: number = 2;
}
