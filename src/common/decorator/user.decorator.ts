import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import { ExceptionMessages } from '../message/exception.message';

export const User = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException(
        ExceptionMessages.NOT_EXIST_USER_PROPERTY_IN_REQUEST
      );
    }

    return user;
  },
);
