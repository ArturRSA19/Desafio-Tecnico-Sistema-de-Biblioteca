import { Livro } from '../../domain/entities/livro.entity';

export class LivroMapper {
  static toDomain(record: any): Livro {
    return new Livro({
      id: record.id,
      titulo: record.titulo,
      autor: record.autor,
      disponivel: record.disponivel,
    });
  }
}
