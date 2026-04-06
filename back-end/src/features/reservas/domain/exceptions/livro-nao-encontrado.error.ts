import { DomainException } from './domain.exception';

export class LivroNaoEncontradoError extends DomainException {
  constructor(livroId: string) {
    super(
      `Livro com ID ${livroId} não encontrado`,
      'LIVRO_NAO_ENCONTRADO',
    );
  }
}
