import { PickType } from '@nestjs/mapped-types';
import { IsEmail, IsString, Length } from 'class-validator';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';

export class CreateUserDto extends PickType(UserEntity, [
  "email",
  "password",
  "name"
]) {
  @IsEmail()
  @ApiProperty({
    example: "example@example.com"
  })
  email: string;

  @Length(6, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "testPw"
  })
  password: string;

  @Length(2, 10, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "테스트 계정"
  })
  name: string;
}
