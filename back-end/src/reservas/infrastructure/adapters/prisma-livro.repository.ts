import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LivroRepositoryPort } from '../../domain/ports/livro-repository.port';
import { Livro } from '../../domain/entities/livro.entity';

@Injectable()
export class PrismaLivroRepository implements LivroRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Livro | null> {
    const record = await this.prisma.livro.findUnique({
      where: { id },
    });

    if (!record) return null;

    return new Livro({
      id: record.id,
      titulo: record.titulo,
      autor: record.autor,
      disponivel: record.disponivel,
    });
  }

  async atualizarDisponibilidade(
    id: string,
    disponivel: boolean,
  ): Promise<void> {
    await this.prisma.livro.update({
      where: { id },
      data: { disponivel },
    });
  }
}
