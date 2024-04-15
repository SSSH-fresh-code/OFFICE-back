export { PickType } from "@nestjs/mapped-types";
import { IsArray, IsNumber, IsOptional, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { AuthsEntity } from "src/auths/entities/auths.entity";
import { PickType } from "@nestjs/mapped-types";

export class CreateAuthDto extends PickType(AuthsEntity, [
  "code", "description"
]) {

  @Length(8, 8, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "00000000"
  })
  code: string;

  @Length(0, 500, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "CAN_USE_LOGIN"
  })
  description: string;

}
