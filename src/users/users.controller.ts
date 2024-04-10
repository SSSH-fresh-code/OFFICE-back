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
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBasicAuth, ApiBearerAuth, ApiBody, ApiCookieAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { TBasicToken, TTokenPayload } from 'types-sssh';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { FindOptionsWhere } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CookieOptions, Response } from 'express';
import { ExceptionMessages } from 'src/common/message/exception.message';
import AuthsEnum from 'src/auths/const/auths.enums';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('login')
  @ApiBasicAuth('login')
  async login(@User() user: TBasicToken, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken } = await this.usersService.login(user);
    const options: CookieOptions = {
      secure: process.env.NEST_MODE === "development" ? true : true,
      sameSite: process.env.NEST_MODE === "development" ? 'none' : 'lax',
      httpOnly: true,
      path: "/",
      expires: new Date(new Date().getTime() + 5000000),
      maxAge: 360000000
    }
    response.cookie('refreshToken', refreshToken, options)

    return { accessToken }
  }

  @Post('refresh')
  @ApiCookieAuth('refresh')
  async refresh(
    @Body() { refreshToken }: { refreshToken: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const accessToken = await this.usersService.refresh(refreshToken);

    const options: CookieOptions = {
      secure: process.env.NEST_MODE === "development" ? true : true,
      sameSite: process.env.NEST_MODE === "development" ? 'none' : 'lax',
      httpOnly: true,
      path: "/",
      expires: new Date(new Date().getTime() + 5000000),
      maxAge: 360000000
    }

    response.cookie('accessToken', accessToken, options)
    return true;
  }

  @Post()
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Roles([AuthsEnum.MODIFY_ANOTHER_USER])
  @Post("cert")
  @ApiBearerAuth('access')
  certUser(@Body('idList') idList: string[]) {
    return this.usersService.certUser(idList);
  }

  @Get("exists")
  @ApiQuery({ name: "userId", required: false, type: "string" })
  @ApiQuery({ name: "userName", required: false, type: "string" })
  async existsUserByUserId(@Query('userId') userId: string, @Query('userName') userName: string) {
    const where: FindOptionsWhere<UserEntity> = {};

    if (userId) where.userId = userId;
    else if (userName) where.userName = userName;
    else throw new BadRequestException(ExceptionMessages.NO_PARAMETER);

    return { isExists: await this.usersService.existsUser(where) };
  }

  @Roles([AuthsEnum.READ_ANOTHER_USER])
  @Get()
  @ApiBearerAuth('access')
  async findUsers(@Query() query: UserPaginationDto) {
    return await this.usersService.findUsers(query);
  }

  @Get(":id")
  @ApiBearerAuth('access')
  async findUser(@User() user: TTokenPayload, @Param('id') id: string) {
    return await this.usersService.findUser(user, id);
  }

  @Patch()
  @ApiBearerAuth('access')
  async updateUser(@User() user: TTokenPayload, @Body() dto: UpdateUserDto) {
    return await this.usersService.updateUser(user, dto);
  }

  @Delete(":id")
  @ApiBearerAuth('access')
  async deleteUser(@User() user: TTokenPayload, @Param('id') id: string) {
    return await this.usersService.deleteUser(user, id);
  }
}
