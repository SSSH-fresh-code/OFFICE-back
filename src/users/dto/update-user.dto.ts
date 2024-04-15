import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from '../entities/user.entity';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PickType(UserEntity, [
  'id',
  'userName',
]) {
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "cf03e1c8-4ea3-471d-ac1d-d652c426a23a"
  })
  id: string;

  @Length(2, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({ example: "" })
  userName: string;

  @IsBoolean()
  @ApiProperty({ example: false })
  isPwReset: boolean;

}
