import { PartialType } from "@nestjs/mapped-types";
import { IsNumber, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { CreateSeriesDto } from "./create-series.dto";

export class UpdateSeriesDto extends PartialType(CreateSeriesDto) {
  @Length(2, 100, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "자바 알아보기"
  })
  name: string;
}
