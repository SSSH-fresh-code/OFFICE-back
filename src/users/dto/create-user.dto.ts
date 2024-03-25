import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from '../entities/user.entity';
import { IsString, Length } from 'class-validator';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';
import { ApiBody, ApiProperty } from '@nestjs/swagger';

export class CreateUserDto extends PickType(UserEntity, [
  'userId',
  'userPw',
  'userName',
]) {
  @Length(6, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "testUser"
  })
  userId: string;

  @Length(8, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "testPw"
  })
  userPw: string;

  @Length(2, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "testName"
  })
  userName: string;
}
