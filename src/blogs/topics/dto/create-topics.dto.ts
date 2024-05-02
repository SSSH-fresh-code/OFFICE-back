import { PickType } from "@nestjs/mapped-types";
import { IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { TopicsEntity } from "../entities/topics.entity";

export class CreateTopicsDto extends PickType(TopicsEntity, [
  'name',
]) {
  @Length(2, 30, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "자바"
  })
  name: string;
}
