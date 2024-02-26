import { ArgumentsHost, Catch, ExceptionFilter, InternalServerErrorException } from "@nestjs/common";
import { format } from "sql-formatter";
import { CustomRepositoryCannotInheritRepositoryError, QueryFailedError } from "typeorm";

@Catch(QueryFailedError)
export class InternalServerErrorExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    console.log("============= ERROR START ==============");
    console.log("========QUERY=========");
    console.log(format(exception.query, { language: 'postgresql' }));
    console.log("params : " + exception.parameters);
    console.log("======================");
    console.log("[QUERT_FAILED_ERROR] DETAIL : " + exception.detail);
    console.log("[QUERT_FAILED_ERROR] PATH : " + request.url);
    console.log("============= ERROR END ==============");

    response.status(500).json({
      statusCode: 500,
      message: "쿼리 실행 중 에러가 발생했습니다. 관리자에게 문의해주세요.",
      timestamp: new Date().toLocaleString('kr'),
      path: request.url,
    });
  }
}