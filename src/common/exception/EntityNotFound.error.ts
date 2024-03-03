import { ArgumentsHost, Catch, ExceptionFilter, InternalServerErrorException } from "@nestjs/common";
import { EntityNotFoundError } from "typeorm";

@Catch(EntityNotFoundError)
export class EntityNotFoundErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    console.log("============= ERROR START ==============");
    console.log("찾지 못한 조건")
    console.log("----------------------------------------")
    console.log(exception.criteria)
    console.log("[ENTITY_NOT_FOUND_ERROR] PATH : " + request.url);
    console.log("============= ERROR END ==============");

    response.status(400).json({
      statusCode: 400,
      message: "존재하지 않는 데이터입니다. 관리자에게 문의해주세요.",
      timestamp: new Date().toLocaleString('kr'),
      path: request.url,
    });
  }
}