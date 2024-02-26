import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { InternalServerErrorExceptionFilter } from './common/exception/Internal.error';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  /** Filters */
  app.useGlobalFilters(new InternalServerErrorExceptionFilter());

  await app.listen(3000);
}
bootstrap();
