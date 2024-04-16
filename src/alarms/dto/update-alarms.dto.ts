import { PickType } from "@nestjs/mapped-types";
import { IsArray, IsNumber, IsOptional, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { AlarmsEntity } from "../entities/alarms.entity";
import { AuthsEntity } from "src/auths/entities/auths.entity";

export class UpdateAlarmsDto extends PickType(AlarmsEntity, [
  'order', 'id'
  , 'name'
  , 'icon'
  , 'title'
  , 'contents'
  , 'path'
]) {

  @IsNumber()
  @ApiProperty({
    example: 1
  })
  id: number;

  @IsNumber()
  @ApiProperty({
    example: 0
  })
  order: number;

  @Length(2, 30, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "_ALARMS"
  })
  name: string;

  @Length(2, 30, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "SMILE"
  })
  icon: string;

  @Length(2, 100, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "승인 요청 계정 !!3!!건"
  })
  title: string;

  @Length(2, 300, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "현재 미승인된 계정이 존재합니다.\n해당 버튼을 눌러 미승인된 계정을 검토 해주세요."
  })
  contents: string;

  @Length(2, 50, { message: legnthValidationMessage })
  @IsOptional()
  @ApiProperty({
    example: "#todayWork"
  })
  path: string;
}
