import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { menusProviders } from 'src/config/database/menus.providers';
import { DatabaseModule } from 'src/config/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MenusController],
  providers: [
    MenusService,
    ...menusProviders
  ],
})
export class MenusModule { }
