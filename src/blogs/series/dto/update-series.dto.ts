import { PartialType } from "@nestjs/mapped-types";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CreateSeriesDto } from "./create-series.dto";

export class UpdateSeriesDto extends PartialType(CreateSeriesDto) {
  @IsNumber()
  id: number;

  @IsOptional()
  @ApiProperty({
    example: "자바 알아보기"
  })
  name: string;

  @IsOptional()
  @ApiProperty({
    example: 0
  })
  topicId: number;
}
