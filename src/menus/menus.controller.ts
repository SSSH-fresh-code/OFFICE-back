import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MenusService } from './menus.service';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { CreateMenusDto } from './dto/create-menus.dto';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { UpdateMenusDto } from './dto/update-menus.dto';

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

  @Patch('')
  @ApiBody({
    schema: {
      properties: {
        id: { type: "number", nullable: false },
        order: { type: "number", nullable: false },
        name: { type: "string", nullable: false },
        icon: { type: "string", nullable: true },
        link: { type: "string", nullable: true },
        parentId: { type: "number", nullable: true },
      }
    },
  })
  async updateMenus(@Body() dto: UpdateMenusDto) {
    return this.menusService.updateMenus(dto);
  }

  @Delete(':id')
  async deleteMenus(@Param('id', ParseIntPipe) id: number, @Query('all', ParseBoolPipe) all: boolean) {
    return this.menusService.deleteMenus(id, all);
  }
}
