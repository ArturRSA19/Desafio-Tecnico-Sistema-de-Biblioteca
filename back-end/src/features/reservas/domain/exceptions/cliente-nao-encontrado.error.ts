import { DomainException } from './domain.exception';

export class ClienteNaoEncontradoError extends DomainException {
  constructor(clienteId: string) {
    super(
      `Cliente com ID ${clienteId} não encontrado`,
      'CLIENTE_NAO_ENCONTRADO',
    );
  }
}
