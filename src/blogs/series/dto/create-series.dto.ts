import { PickType } from "@nestjs/mapped-types";
import { IsNumber, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { SeriesEntity } from "../entities/series.entity";

export class CreateSeriesDto extends PickType(SeriesEntity, [
  'name'
]) {
  @Length(2, 30, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "자바 알아보기"
  })
  name: string;

  @IsNumber()
  topicId: number;
}
