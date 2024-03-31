import { Controller, Get, Post } from '@nestjs/common';
import { WorkService } from './work.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload } from 'types-sssh';

@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) { }

  @Post('')
  @Roles('MANAGER')
  @ApiBearerAuth('access')
  async goToWork(@User() user: TTokenPayload) {
    return await this.workService.goToWork(user);
  }

}
