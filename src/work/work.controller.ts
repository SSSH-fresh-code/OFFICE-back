import { Body, Controller, Delete, Get, ParseArrayPipe, Patch, Post, Query } from '@nestjs/common';
import { WorkService } from './work.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBody, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload } from 'types-sssh';

@Roles('MANAGER')
@Controller('work')
@ApiCookieAuth('access')
export class WorkController {
  constructor(private readonly workService: WorkService) { }

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
  async getOffWork(@User() user: TTokenPayload, @Body('workDetail') workDetail?: string) {
    return await this.workService.getOffWork(user, workDetail);
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
