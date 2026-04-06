import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { LivroRepositoryOutPort } from '../../../application/ports/out/livro-repository.out.port';
import { Livro } from '../../../domain/entities/livro.entity';
import { LivroMapper } from '../../../application/mappers/livro.mapper';

@Injectable()
export class PrismaLivroRepository implements LivroRepositoryOutPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Livro | null> {
    const record = await this.prisma.livro.findUnique({
      where: { id },
    });

    if (!record) return null;

    return LivroMapper.toDomain(record);
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
