import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ReservaRepositoryPort,
  CriarReservaData,
} from '../../domain/ports/reserva-repository.port';
import { Reserva } from '../../domain/entities/reserva.entity';

@Injectable()
export class PrismaReservaRepository implements ReservaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarReservaData): Promise<Reserva> {
    const record = await this.prisma.reserva.create({
      data: {
        clienteId: data.clienteId,
        clienteNome: data.clienteNome,
        clienteCpf: data.clienteCpf,
        livroId: data.livroId,
        dataReserva: data.dataReserva,
        dataPrevistaDevolucao: data.dataPrevistaDevolucao,
      },
      include: {
        cliente: { select: { id: true, nome: true, cpf: true } },
        livro: {
          select: { id: true, titulo: true, autor: true, disponivel: true },
        },
      },
    });

    return this.toDomain(record);
  }

  async buscarPorId(id: string): Promise<Reserva | null> {
    let record: any;

    try {
      record = await this.prisma.reserva.findUnique({
        where: { id },
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
          livro: { select: { id: true, titulo: true, autor: true } },
        },
      });
    } catch (error) {
      if (!this.isLivroInconsistenteError(error)) {
        throw error;
      }

      record = await this.prisma.reserva.findUnique({
        where: { id },
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
        },
      });

      if (record?.livroId) {
        const livro = await this.prisma.livro.findUnique({
          where: { id: record.livroId },
          select: { id: true, titulo: true, autor: true },
        });
        record = { ...record, livro: livro ?? null };
      }
    }

    if (!record) return null;

    return this.toDomain(record);
  }

  async buscarTodas(): Promise<Reserva[]> {
    let records: any[];

    try {
      records = await this.prisma.reserva.findMany({
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
          livro: { select: { id: true, titulo: true, autor: true } },
        },
        orderBy: { dataReserva: 'desc' },
      });
    } catch (error) {
      if (!this.isLivroInconsistenteError(error)) {
        throw error;
      }

      records = await this.prisma.reserva.findMany({
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
        },
        orderBy: { dataReserva: 'desc' },
      });

      records = await this.enrichWithLivros(records);
    }

    return records.map((r) => this.toDomain(r));
  }

  async buscarPorCliente(clienteId: string): Promise<Reserva[]> {
    let records: any[];

    try {
      records = await this.prisma.reserva.findMany({
        where: { clienteId },
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
          livro: { select: { id: true, titulo: true, autor: true } },
        },
        orderBy: { dataReserva: 'desc' },
      });
    } catch (error) {
      if (!this.isLivroInconsistenteError(error)) {
        throw error;
      }

      records = await this.prisma.reserva.findMany({
        where: { clienteId },
        include: {
          cliente: { select: { id: true, nome: true, cpf: true } },
        },
        orderBy: { dataReserva: 'desc' },
      });

      records = await this.enrichWithLivros(records);
    }

    return records.map((r) => this.toDomain(r));
  }

  async buscarEmAtraso(dataAtual: Date): Promise<Reserva[]> {
    const records = await this.prisma.reserva.findMany({
      where: {
        dataDevolucao: null,
        dataPrevistaDevolucao: { lt: dataAtual },
      },
      include: {
        cliente: { select: { id: true, nome: true, cpf: true } },
        livro: { select: { id: true, titulo: true, autor: true } },
      },
      orderBy: { dataPrevistaDevolucao: 'asc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async atualizarDevolucao(
    id: string,
    dataDevolucao: Date,
  ): Promise<Reserva> {
    const record = await this.prisma.reserva.update({
      where: { id },
      data: { dataDevolucao },
      include: {
        cliente: { select: { id: true, nome: true, cpf: true } },
        livro: {
          select: { id: true, titulo: true, autor: true, disponivel: true },
        },
      },
    });

    return this.toDomain(record);
  }

  private async enrichWithLivros(records: any[]): Promise<any[]> {
    const livroIds: string[] = Array.from(
      new Set(
        records
          .map((r) => r.livroId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const livros = await this.prisma.livro.findMany({
      where: { id: { in: livroIds } },
      select: { id: true, titulo: true, autor: true },
    });

    const livroPorId = new Map(livros.map((l) => [l.id, l]));

    return records.map((r) => ({
      ...r,
      livro: livroPorId.get(r.livroId) ?? null,
    }));
  }

  private isLivroInconsistenteError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes(
      'Inconsistent query result: Field livro is required to return data, got `null` instead.',
    );
  }

  private toDomain(record: any): Reserva {
    return new Reserva({
      id: record.id,
      clienteId: record.clienteId,
      clienteNome: record.clienteNome,
      clienteCpf: record.clienteCpf,
      livroId: record.livroId,
      dataReserva: record.dataReserva,
      dataPrevistaDevolucao: record.dataPrevistaDevolucao,
      dataDevolucao: record.dataDevolucao,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      cliente: record.cliente ?? null,
      livro: record.livro ?? null,
    });
  }
}
