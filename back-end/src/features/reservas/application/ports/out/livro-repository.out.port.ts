import { Livro } from '../../../domain/entities/livro.entity';

export interface LivroRepositoryOutPort {
  buscarPorId(id: string): Promise<Livro | null>;
  atualizarDisponibilidade(id: string, disponivel: boolean): Promise<void>;
}
