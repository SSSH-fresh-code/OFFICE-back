import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('OFFICE SWAGGER')
  .setDescription('SSSH OFFICE 테스트용 스웨거')
  .setVersion('0.0.1')
  .addBasicAuth(
    {
      type: 'http',
      name: 'login',
    },
    'login',
  )
  .addBearerAuth(
    {
      type: 'http',
      name: 'access',
    },
    'access',
  )
  .addCookieAuth(
    "refreshToken",
    {
      name: "refreshToken",
      type: "apiKey",
      in: "cookie"
    },
    "refresh"
  )
  .addTag('users')
  .build();
