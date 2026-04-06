export interface AuditLoggerOutPort {
  logEvent(
    tipoEvento: string,
    entidadeId: string,
    payload?: Record<string, unknown>,
  ): void;
}
