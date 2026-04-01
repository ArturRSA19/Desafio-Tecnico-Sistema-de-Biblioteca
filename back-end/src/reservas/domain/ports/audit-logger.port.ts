export interface AuditLoggerPort {
  logEvent(
    tipoEvento: string,
    entidadeId: string,
    payload?: Record<string, unknown>,
  ): void;
}
