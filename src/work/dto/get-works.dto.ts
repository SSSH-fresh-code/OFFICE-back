import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { uuidValidationMessage } from "src/common/message/uuid-validation.message";

export default class getWorkDto {
  @Length(10, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "20240401"
  })
  startDate: string;

  @Length(10, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "20240402"
  })
  endDate: string;

  @IsOptional()
  @IsUUID(4, { message: uuidValidationMessage })
  @ApiProperty({
    example: ""
  })
  id?: string;
}