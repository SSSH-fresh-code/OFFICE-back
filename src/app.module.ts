import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuthsModule } from './auths/auths.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthsGuard } from './common/guard/roles.guard';
import { TokenGuard } from './common/guard/token.guard';
import { WorkModule } from './work/work.module';
import { AlarmsModule } from './alarms/alarms.module';
import { MenusModule } from './menus/menus.module';
import { BlogModule } from './blogs/blog.module';
import { AppLoggerMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
    }),
    UsersModule,
    CommonModule,
    AuthsModule,
    WorkModule,
    AlarmsModule,
    MenusModule,
    BlogModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TokenGuard
    },
    {
      provide: APP_GUARD,
      useClass: AuthsGuard
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppLoggerMiddleware)
      .forRoutes('*');
  }
}
