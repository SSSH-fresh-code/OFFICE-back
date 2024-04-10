import { IsArray, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/message/string-validation.message';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAuthUserDto {
  @IsString({ message: stringValidationMessage })
  @ApiProperty({
    example: "cf03e1c8-4ea3-471d-ac1d-d652c426a23a"
  })
  id: string;

  @IsArray()
  @ApiProperty({ example: [] })
  auths: string[];
}
