import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MenusService } from './menus.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { CreateMenusDto } from './dto/create-menus.dto';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';

@ApiTags('menus')
@Controller('menus')
@Roles([AuthsEnum.CAN_USE_MENU])
@ApiBearerAuth('access')
export class MenusController {
  constructor(private readonly menusService: MenusService) { }

  @Get('/auths')
  async getMenusByAuths(@User() user: TTokenPayload) {
    return await this.menusService.getMenusByAuths(user);
  }

  @Get('all')
  async getAllParentMenus() {
    return await this.menusService.getAllParentMenus();
  }

  @Get('/:id')
  async getParentMenus(@Param('id', ParseIntPipe) id: number) {
    return await this.menusService.getParentMenus(id);
  }

  @Post('')
  @ApiBody({
    schema: {
      properties: {
        order: { type: "number", nullable: false },
        name: { type: "string", nullable: false },
        icon: { type: "string", nullable: true },
        link: { type: "string", nullable: true },
        parentId: { type: "string", nullable: true },
      }
    },
  })
  async createMenus(@Body() dto: CreateMenusDto) {
    return this.menusService.createMenus(dto);
  }
}
