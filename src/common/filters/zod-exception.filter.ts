import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

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
        details: exception.issues.map((error: ZodIssue) => ({
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
    let details: Array<{ field: string; message: string }> | undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      errorMessage = (responseObj.message as string) || errorMessage;
      errorCode = (responseObj.code as string) || errorCode;
      details =
        (responseObj.errors as Array<{ field: string; message: string }>) ||
        (responseObj.details as Array<{ field: string; message: string }>);
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
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        code = (responseObj.code as string) || code;
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
