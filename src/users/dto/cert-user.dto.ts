import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from '../entities/user.entity';
import { IsString, Length } from 'class-validator';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { ApiProperty } from '@nestjs/swagger';
import { TUserRole } from 'types-sssh';

export class CertUserDto extends PickType(UserEntity, [
  'id',
  'userRole',
]) {
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: ""
  })
  id: string;


  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "testName"
  })
  userRole: TUserRole;
}
