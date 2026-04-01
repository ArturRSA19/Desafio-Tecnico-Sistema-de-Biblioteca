import { DomainException } from './domain.exception';

export class DataDevolucaoInvalidaError extends DomainException {
  constructor() {
    super(
      'A data prevista de devolução deve ser posterior à data de reserva',
      'DATA_DEVOLUCAO_INVALIDA',
    );
  }
}
