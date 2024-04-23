import { PickType } from "@nestjs/mapped-types";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { MenusEntity } from "../entities/menus.entity";

export class CreateMenusDto extends PickType(MenusEntity, [
  'name',
  'order',
  'link',
  'icon',
]) {

  @IsNumber()
  @ApiProperty({
    example: 1
  })
  order: number;

  @Length(2, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "직원 관리"
  })
  name: string;


  @IsOptional()
  @ApiProperty({
    example: "USER"
  })
  icon?: string;


  @IsOptional()
  @ApiProperty({
    example: "/users"
  })
  link?: string;

  @IsOptional()
  @ApiProperty({
    example: "1"
  })
  parentId?: number;
}
