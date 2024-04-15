import { IsArray, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAuthAlarmsDto {
  @IsNumber()
  @ApiProperty({
    example: 1
  })
  id: number;

  @IsArray()
  @ApiProperty({ example: [] })
  auths: string[];
}
