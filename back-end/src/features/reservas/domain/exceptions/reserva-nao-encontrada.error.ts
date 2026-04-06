import { DomainException } from './domain.exception';

export class ReservaNaoEncontradaError extends DomainException {
  constructor(reservaId: string) {
    super(
      `Reserva com ID ${reservaId} não encontrada`,
      'RESERVA_NAO_ENCONTRADA',
    );
  }
}
