import { PickType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';

export class UpdateUserDto extends PickType(UserEntity, [
  'id',
  'name',
]) {
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "cf03e1c8-4ea3-471d-ac1d-d652c426a23a"
  })
  id: string;

  @Length(2, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({ example: "" })
  name: string;

  @IsBoolean()
  @ApiProperty({ example: false })
  isPwReset: boolean;
}
