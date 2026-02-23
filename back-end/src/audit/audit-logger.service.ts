import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { TipoEvento } from './enums/tipo-evento.enum';

/** Estrutura persistida no índice `system_events` do Elasticsearch. */
export interface AuditEventDocument {
  tipo_evento: TipoEvento;
  /** Timestamp ISO-8601 compatível com o campo padrão do ECS/Kibana. */
  '@timestamp': string;
  entidade_id: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  private static readonly INDEX = 'system_events';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Registra um evento de auditoria no Elasticsearch de forma assíncrona
   * (fire-and-forget): a promise não é aguardada, logo nunca bloqueia a
   * resposta HTTP do caller.
   *
   * @param tipoEvento   - Tipo do evento ocorrido (ver {@link TipoEvento}).
   * @param entidadeId   - ID da entidade afetada (reserva, livro, cliente…).
   * @param payloadAdicional - Dados extras relevantes para o contexto do evento.
   */
  logEvent(
    tipoEvento: TipoEvento,
    entidadeId: string,
    payloadAdicional?: Record<string, unknown>,
  ): void {
    const document: AuditEventDocument = {
      tipo_evento: tipoEvento,
      '@timestamp': new Date().toISOString(),
      entidade_id: entidadeId,
      payload: payloadAdicional ?? {},
    };

    // Fire-and-forget: não aguardamos a promise para não atrasar o caller.
    this.elasticsearchService
      .getClient()
      .index<AuditEventDocument>({
        index: AuditLoggerService.INDEX,
        document,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Falha ao registrar evento de auditoria [${tipoEvento}] para entidade "${entidadeId}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}
