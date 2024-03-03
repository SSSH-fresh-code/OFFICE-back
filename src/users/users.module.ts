import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { AuthsModule } from '../auths/auths.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthsModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
