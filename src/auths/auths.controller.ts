import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { Page, TTokenPayload, TWork } from "types-sssh";
import { User } from "src/common/decorator/user.decorator";
import { CreateAlarmsDto } from "./dto/create-alarms.dto";
import { UpdateAlarmsDto } from "./dto/update-alarms.dto";
import { AlarmsPaginationDto } from "./dto/alarms-pagination.dto";
import { AlarmsEntity } from "./entities/alarms.entity";

@Controller('auths')
export class AuthsController {
  constructor(private readonly authsService: AuthsService) { }

  @Get('alarms')
  async getAlarms(
    @User() user: TTokenPayload,
    @Query('readOnly', new DefaultValuePipe(false), ParseBoolPipe)
    readOnly: boolean,
    @Query() page: AlarmsPaginationDto
  ): Promise<any[] | Page<AlarmsEntity>> {
    return await this.authsService.getAlarms(user, readOnly, page);
  }

  @Get('alarms/:id')
  async getAlarm(
    @User() user: TTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.authsService.getAlarm(user, id);
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
  async deleteAlarms(@Param("id", ParseIntPipe) id: number) {
    return await this.authsService.deleteAlarms(id);
  }
}