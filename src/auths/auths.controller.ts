import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "src/common/decorator/roles.decorator";
import AuthsEnum from "./const/auths.enums";
import { AuthsPaginationDto } from "./dto/auths-pagination.dto";

@Roles([AuthsEnum.CAN_USE_AUTH])
@ApiBearerAuth('access')
@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) { }

  @Get('')
  async getAuths(@Query() page: AuthsPaginationDto) {
    return await this.authsService.getAuths(page);
  }

  @Get('all')
  async getAllAuths() {
    return await this.authsService.getAllAuths();
  }

  @Get('users/:id')
  async getAuthsByUser(@Param('id') id: string) {
    return await this.authsService.getAuthsByUser(id);
  }

  @Get('alarms/:id')
  async getAuthsByAlarm(@Param('id', ParseIntPipe) id: number) {
    return await this.authsService.getAuthsByAlarm(id);
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