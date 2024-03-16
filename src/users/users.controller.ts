import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  DefaultValuePipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBasicAuth, ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { TBasicToken, TTokenPayload } from 'types-sssh';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { FindOptionsWhere } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('login')
  @Roles('GUEST')
  @ApiBasicAuth('login')
  async login(@User() user: TBasicToken) {
    return this.usersService.login(user);
  }

  @Post()
  @Roles('GUEST')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Get("exists")
  @Roles('GUEST')
  @ApiQuery({ name: "userId", required: false, type: "string" })
  @ApiQuery({ name: "userName", required: false, type: "string" })
  existsUserByUserId(@Query('userId') userId: string, @Query('userName') userName: string) {
    const where: FindOptionsWhere<UserEntity> = {};

    if (userId) where.userId = userId;
    else if (userName) where.userName = userName;
    else throw new BadRequestException("파라미터가 존재하지 않습니다.");

    return this.usersService.existsUser(where);
  }

  @Get()
  @Roles('MANAGER')
  @ApiBearerAuth('access')
  async findUsers(@Query() query: UserPaginationDto) {
    return await this.usersService.findUsers(query);
  }

  @Get(":id")
  @Roles('USER')
  @ApiBearerAuth('access')
  async findUser(@User() user: TTokenPayload, @Param('id') id: string) {
    return await this.usersService.findUser(user, id);
  }

  @Patch()
  @Roles('USER')
  @ApiBearerAuth('access')
  async updateUser(@User() user: TTokenPayload, @Body() dto: UpdateUserDto) {
    return await this.usersService.updateUser(user, dto);
  }

  @Delete(":id")
  @Roles('ADMIN')
  @ApiBearerAuth('access')
  async deleteUser(@User() user: TTokenPayload, @Param('id') id: string) {
    return await this.usersService.deleteUser(user, id);
  }
}
