import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type LocacaoSyncDocument = {
  idLocacao: string;
  dataLocacao: Date;
  dataPrevistaDevolucao: Date;
  dataDevolucao: Date | null;
  status: 'ATIVA' | 'DEVOLVIDA';
  idLivro: string;
  livroTitulo: string;
  idUsuario: string | null;
  usuarioNome: string | null;
  updatedAt: Date | null;
};

@Injectable()
export class LocacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForSync(updatedAfter?: Date): Promise<LocacaoSyncDocument[]> {
    const where: Prisma.ReservaWhereInput | undefined = updatedAfter
      ? {
          OR: [
            {
              updatedAt: {
                gt: updatedAfter,
              },
            },
            {
              dataReserva: {
                gt: updatedAfter,
              },
            },
            {
              dataDevolucao: {
                gt: updatedAfter,
              },
            },
          ],
        }
      : undefined;

    let reservas;

    try {
      reservas = await this.prisma.reserva.findMany({
        where,
        include: {
          livro: {
            select: {
              id: true,
              titulo: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
      });
    } catch {
      reservas = await this.prisma.reserva.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
      });

      const livroIds: string[] = Array.from(
        new Set(
          reservas
            .map((reserva) => reserva.livroId)
            .filter((livroId): livroId is string => Boolean(livroId)),
        ),
      );

      const livros = await this.prisma.livro.findMany({
        where: {
          id: { in: livroIds },
        },
        select: {
          id: true,
          titulo: true,
        },
      });

      const livroPorId = new Map(livros.map((livro) => [livro.id, livro]));

      reservas = reservas.map((reserva) => ({
        ...reserva,
        livro: livroPorId.get(reserva.livroId) ?? {
          id: reserva.livroId,
          titulo: '',
        },
      }));
    }

    return reservas.map((reserva) => {
      const usuarioNome = reserva.cliente?.nome ?? reserva.clienteNome ?? null;
      const idUsuario = reserva.cliente?.id ?? reserva.clienteId ?? null;

      return {
        idLocacao: reserva.id,
        dataLocacao: reserva.dataReserva,
        dataPrevistaDevolucao: reserva.dataPrevistaDevolucao,
        dataDevolucao: reserva.dataDevolucao ?? null,
        status: reserva.dataDevolucao ? 'DEVOLVIDA' : 'ATIVA',
        idLivro: reserva.livro?.id ?? reserva.livroId,
        livroTitulo: reserva.livro?.titulo ?? '',
        idUsuario,
        usuarioNome,
        updatedAt: reserva.updatedAt ?? null,
      };
    });
  }
}
