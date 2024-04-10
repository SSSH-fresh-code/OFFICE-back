import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AuthsService } from "./auths.service";

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) { }

  @Get('')
  async getAuths() {
    // return this.authsService.getAuths();
  }
}