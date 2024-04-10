import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AlarmsService } from "./alarms.service";
import { Page, TTokenPayload, TWork } from "types-sssh";
import { User } from "src/common/decorator/user.decorator";
import { CreateAlarmsDto } from "../alarms/dto/create-alarms.dto";
import { UpdateAlarmsDto } from "../alarms/dto/update-alarms.dto";
import { AlarmsPaginationDto } from "../alarms/dto/alarms-pagination.dto";
import { AlarmsEntity } from "./entities/alarms.entity";

@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) { }

  @Get('')
  async getAlarms(
    @User() user: TTokenPayload,
    @Query('readOnly', new DefaultValuePipe(false), ParseBoolPipe)
    readOnly: boolean,
    @Query() page: AlarmsPaginationDto
  ): Promise<any[] | Page<AlarmsEntity>> {
    return await this.alarmsService.getAlarms(user, readOnly, page);
  }

  @Get(':id')
  async getAlarm(
    @User() user: TTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.alarmsService.getAlarm(user, id);
  }

  @Post('')
  async postAlarms(@Body() createAlarmsDto: CreateAlarmsDto) {
    return await this.alarmsService.postAlarms(createAlarmsDto);
  }

  @Patch('')
  async patchAlarms(@Body() updateAlarmsDto: UpdateAlarmsDto) {
    return await this.alarmsService.patchAlarms(updateAlarmsDto);
  }

  @Delete(':id')
  async deleteAlarms(@Param("id", ParseIntPipe) id: number) {
    return await this.alarmsService.deleteAlarms(id);
  }
}