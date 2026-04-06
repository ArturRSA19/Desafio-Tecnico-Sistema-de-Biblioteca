import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions';

const CODE_TO_STATUS: Record<string, HttpStatus> = {
  RESERVA_NAO_ENCONTRADA: HttpStatus.NOT_FOUND,
  CLIENTE_NAO_ENCONTRADO: HttpStatus.NOT_FOUND,
  LIVRO_NAO_ENCONTRADO: HttpStatus.NOT_FOUND,
  LIVRO_INDISPONIVEL: HttpStatus.CONFLICT,
  RESERVA_JA_DEVOLVIDA: HttpStatus.CONFLICT,
  DATA_DEVOLUCAO_INVALIDA: HttpStatus.BAD_REQUEST,
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      CODE_TO_STATUS[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
    });
  }
}
