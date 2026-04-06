import { DomainException } from './domain.exception';

export class ReservaJaDevolvidaError extends DomainException {
  constructor() {
    super('Este livro já foi devolvido', 'RESERVA_JA_DEVOLVIDA');
  }
}
