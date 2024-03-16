import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from '../entities/user.entity';
import { IsString, Length } from 'class-validator';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { TUserRole } from 'types-sssh';

export class UpdateUserDto extends PickType(UserEntity, [
  'id',
  'userName',
  'userRole'
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

  @IsString({ message: stringValidationMessage })
  @ApiProperty({ example: "" })
  userRole: TUserRole;
}
