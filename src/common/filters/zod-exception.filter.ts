import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * Zod 검증 에러를 처리하는 예외 필터
 */
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;

    const errorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: status,
        timestamp: new Date(),
        path: request.url,
        details: exception.errors.map((error) => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
        })),
      },
    };

    response.status(status).json(errorResponse);
  }
}

/**
 * 모든 HTTP 예외를 처리하는 필터
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage = 'An error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let details: any[] | undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      errorMessage = responseObj.message || errorMessage;
      errorCode = responseObj.code || errorCode;
      details = responseObj.errors || responseObj.details;
    }

    const errorResponse = {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        statusCode: status,
        timestamp: new Date(),
        path: request.url,
        ...(details && { details }),
      },
    };

    response.status(status).json(errorResponse);
  }
}

/**
 * 모든 예외를 처리하는 필터 (예상치 못한 에러 포함)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    // HTTP 예외인 경우
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        code = responseObj.code || code;
      }
    }
    // Zod 에러인 경우
    else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
    }
    // 일반 에러인 경우
    else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      success: false,
      error: {
        message,
        code,
        statusCode: status,
        timestamp: new Date(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}