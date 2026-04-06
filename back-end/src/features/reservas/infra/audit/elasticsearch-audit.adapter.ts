import { Injectable } from '@nestjs/common';
import { AuditLoggerService } from '../../../../audit/audit-logger.service';
import { TipoEvento } from '../../../../audit/enums/tipo-evento.enum';
import { AuditLoggerOutPort } from '../../application/ports/out/audit-logger.out.port';

@Injectable()
export class ElasticsearchAuditAdapter implements AuditLoggerOutPort {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  logEvent(
    tipoEvento: string,
    entidadeId: string,
    payload?: Record<string, unknown>,
  ): void {
    this.auditLogger.logEvent(
      tipoEvento as TipoEvento,
      entidadeId,
      payload,
    );
  }
}
