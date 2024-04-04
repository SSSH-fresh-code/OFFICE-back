import { Body, Controller, Delete, Get, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { TTokenPayload } from "types-sssh";
import { User } from "src/common/decorator/user.decorator";
import { CreateAlarmsDto } from "./dto/create-alarms.dto";
import { UpdateAlarmsDto } from "./dto/update-alarms.dto";

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) { }

  @Get('alarms')
  async getAlarms(@User() user: TTokenPayload) {
    return await this.authsService.getAlarms(user);
  }

  @Post('alarms')
  async postAlarms(@Body() createAlarmsDto: CreateAlarmsDto) {
    return await this.authsService.postAlarms(createAlarmsDto);
  }

  @Patch('alarms')
  async patchAlarms(@Body() updateAlarmsDto: UpdateAlarmsDto) {
    return await this.authsService.patchAlarms(updateAlarmsDto);
  }

  @Delete('alarms/:id')
  async deleteAlarms(@Query("id", ParseIntPipe) id: number) {
    return await this.authsService.deleteAlarms(id);
  }
}