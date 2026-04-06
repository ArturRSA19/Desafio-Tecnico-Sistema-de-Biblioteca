import { DomainException } from './domain.exception';

export class LivroIndisponivelError extends DomainException {
  constructor() {
    super(
      'Este livro não está disponível para reserva no momento',
      'LIVRO_INDISPONIVEL',
    );
  }
}
