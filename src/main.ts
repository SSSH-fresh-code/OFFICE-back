import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { QueryFailedErrorFilter } from './common/exception/QueryFailed.error';
import { EntityNotFoundErrorFilter } from './common/exception/EntityNotFound.error';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ credentials: true, origin: process.env.CORS_ORIGIN })

  if (process.env.NEST_MODE !== "production") {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  /** Filters */
  app.useGlobalFilters(new QueryFailedErrorFilter());
  app.useGlobalFilters(new EntityNotFoundErrorFilter());

  await app.listen(process.env.PORT);
}
bootstrap();
