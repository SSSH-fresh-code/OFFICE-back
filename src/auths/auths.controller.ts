import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "src/common/decorator/roles.decorator";
import AuthsEnum from "./const/auths.enums";

@Roles([AuthsEnum.CAN_USE_AUTH])
@ApiBearerAuth('access')
@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) { }

  @Get('')
  async getAuths() {
    return await this.authsService.getAuths();
  }

  @Get(':id')
  async getAuthsByUser(@Param('id') id: string) {
    return await this.authsService.getAuthsByUser(id);
  }

  @Post()
  async postAuths(@Body() dto: CreateAuthDto) {
    return await this.authsService.postAuths(dto);
  }

  @Delete(":code")
  async deleteAuths(@Param('code') code: string) {
    return await this.authsService.deleteAuths(code);
  }
}