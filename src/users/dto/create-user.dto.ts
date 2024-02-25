import { PickType } from '@nestjs/mapped-types';
import { UserEntity } from '../entities/user.entity';
import { IsString, Length } from 'class-validator';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { legnthValidationMessage } from 'src/common/message/length-validation.message';

export class CreateUserDto extends PickType(UserEntity, [
  'userId',
  'userPw',
  'userName',
]) {
  @Length(6, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  userId: string;

  @Length(8, 20, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  userPw: string;

  @Length(4, 30, { message: legnthValidationMessage })
  @IsString({ message: stringValidationMessage })
  userName: string;
}
