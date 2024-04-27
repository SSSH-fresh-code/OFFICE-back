import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MenusService } from './menus.service';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { CreateMenusDto } from './dto/create-menus.dto';
import { User } from 'src/common/decorator/user.decorator';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { UpdateMenusDto } from './dto/update-menus.dto';
import { MenuPaginationDto } from './dto/menu-pagination.dto';

@ApiTags('menus')
@Controller('menus')
@ApiBearerAuth('access')
export class MenusController {
  constructor(private readonly menusService: MenusService) { }

  @Get('/auths')
  async getMenusByAuths(@User() user: TTokenPayload) {
    return await this.menusService.getMenusByAuths(user);
  }

  @Roles([AuthsEnum.CAN_USE_MENU])
  @Get('')
  async getAllMenus(@Query() query: MenuPaginationDto) {
    return await this.menusService.findMenus(query);
  }

  @Roles([AuthsEnum.CAN_USE_MENU])
  @Get('all')
  async getAllParentMenus() {
    return await this.menusService.getAllParentMenus();
  }

  @Roles([AuthsEnum.CAN_USE_MENU])
  @Get('/:id')
  async getParentMenus(@Param('id', ParseIntPipe) id: number) {
    return await this.menusService.getParentMenus(id);
  }

  @Roles([AuthsEnum.CAN_USE_MENU])
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

  @Roles([AuthsEnum.CAN_USE_MENU])
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

  @Roles([AuthsEnum.CAN_USE_MENU])
  @Delete(':id')
  async deleteMenus(@Param('id', ParseIntPipe) id: number, @Query('all', new DefaultValuePipe(false), ParseBoolPipe) all: boolean) {
    return this.menusService.deleteMenus(id, all);
  }
}
