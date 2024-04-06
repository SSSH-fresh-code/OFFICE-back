import { PickType } from "@nestjs/mapped-types";
import { AlarmsEntity } from "../entities/alarms.entity";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";
import { legnthValidationMessage } from "src/common/message/length-validation.message";
import { stringValidationMessage } from "src/common/message/string-validation.message";
import { ApiProperty } from "@nestjs/swagger";
import { TUserRole } from "types-sssh";

export class CreateAlarmsDto extends PickType(AlarmsEntity, [
  'name'
  , 'icon'
  , 'title'
  , 'contents'
  , 'path'
]) {

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

  @IsOptional()
  @ApiProperty({
    example: "#todayWork"
  })
  path: string;

  @Length(2, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "ADMIN"
  })
  userRole: TUserRole;
}
