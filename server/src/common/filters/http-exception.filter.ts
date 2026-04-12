import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = -1;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        if (responseObj.code) {
          code = responseObj.code as number;
        }
      }

      if (status === HttpStatus.BAD_REQUEST && code === -1) {
        code = 400;
      } else if (status === HttpStatus.UNAUTHORIZED && code === -1) {
        code = 401;
      } else if (status === HttpStatus.FORBIDDEN && code === -1) {
        code = 403;
      } else if (status === HttpStatus.NOT_FOUND && code === -1) {
        code = 404;
      } else if (code === -1) {
        code = status;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
