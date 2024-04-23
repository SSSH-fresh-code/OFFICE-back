import { PartialType, PickType } from "@nestjs/mapped-types";
import { IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CreateMenusDto } from "./create-menus.dto";

export class UpdateMenusDto extends PartialType(CreateMenusDto) {
  @IsNumber()
  @ApiProperty({
    example: 1
  })
  id: number;

  @IsOptional()
  order?: number;

  @IsOptional()
  name?: string;

  @IsOptional()
  childMenus?: Omit<UpdateMenusDto, "childMenus">[];
}
