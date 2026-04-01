import { Livro } from '../entities/livro.entity';

export interface LivroRepositoryPort {
  buscarPorId(id: string): Promise<Livro | null>;
  atualizarDisponibilidade(id: string, disponivel: boolean): Promise<void>;
}
