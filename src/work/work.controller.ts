import { Body, Controller, DefaultValuePipe, Delete, Get, ParseArrayPipe, ParseBoolPipe, Patch, Post, Query } from '@nestjs/common';
import { WorkService } from './work.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload, TWork } from '@sssh-fresh-code/types-sssh';
import getWorkDto from './dto/get-works.dto';
import AuthsEnum from 'src/auths/const/auths.enums';

@Roles([AuthsEnum.CAN_USE_WORK])
@Controller('work')
@ApiBearerAuth('access')
export class WorkController {
  constructor(private readonly workService: WorkService) { }

  @Get('')
  async getWorks(
    @User() user: TTokenPayload
    , @Query() query: getWorkDto
  ): Promise<TWork[]> {
    return await this.workService.getWorks(user, query);
  }

  @Roles([AuthsEnum.READ_ANOTHER_WORK])
  @Get('today')
  async getTodayWorkedMembers() {
    return await this.workService.getTodayWorkedMembers();
  }

  @Post('')
  async goToWork(@User() user: TTokenPayload) {
    return await this.workService.goToWork(user);
  }

  @ApiBody({
    schema: {
      properties: {
        workDetail: { type: "string", nullable: true }
      }
    },
  })
  @Patch('')
  async getOffWork(
    @User() user: TTokenPayload
    , @Query('off', new DefaultValuePipe(false), ParseBoolPipe) off: boolean
    , @Body('workDetail') workDetail?: string
  ) {
    return await this.workService.getOffWork(user, off, workDetail);
  }

  @ApiQuery({
    name: "id",
    type: "string"
  })
  @ApiQuery({
    name: "baseDates",
    type: "string",
    isArray: true
  })
  @Delete('')
  async deleteWorks(@User() user: TTokenPayload, @Query("id") id: string, @Query('baseDates', ParseArrayPipe) baseDates: string[]) {
    return await this.workService.deleteWorks(user, id, baseDates);
  }
}
