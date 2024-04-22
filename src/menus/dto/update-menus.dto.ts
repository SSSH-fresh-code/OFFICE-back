import { PickType } from "@nestjs/mapped-types";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { MenusEntity } from "../entities/menus.entity";
import { CreateMenusDto } from "./create-menus.dto";

export class UpdateMenusDto extends CreateMenusDto {
  @IsNumber()
  @ApiProperty({
    example: 1
  })
  id: number;

}
