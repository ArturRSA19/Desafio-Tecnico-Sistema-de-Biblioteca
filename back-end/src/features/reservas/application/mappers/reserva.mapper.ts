import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaOutDto } from '../dto/out/reserva.out.dto';
import { ReservaEmAtrasoOutDto } from '../dto/out/reserva-em-atraso.out.dto';

export class ReservaMapper {
  static toDomain(record: any): Reserva {
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

  static toOutDto(entity: Reserva): ReservaOutDto {
    const plain = entity.toPlain();
    return {
      id: plain.id,
      clienteId: plain.clienteId,
      clienteNome: plain.clienteNome,
      clienteCpf: plain.clienteCpf,
      livroId: plain.livroId,
      dataReserva: plain.dataReserva,
      dataPrevistaDevolucao: plain.dataPrevistaDevolucao,
      dataDevolucao: plain.dataDevolucao,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
      cliente: plain.cliente
        ? { id: plain.cliente.id, nome: plain.cliente.nome, cpf: plain.cliente.cpf }
        : null,
      livro: plain.livro
        ? {
            id: plain.livro.id,
            titulo: plain.livro.titulo,
            autor: plain.livro.autor,
            disponivel: plain.livro.disponivel,
          }
        : null,
    };
  }

  static toEmAtrasoOutDto(
    entity: Reserva,
    diasDeAtraso: number,
    multaTotal: number,
  ): ReservaEmAtrasoOutDto {
    return {
      ...ReservaMapper.toOutDto(entity),
      diasDeAtraso,
      multaTotal,
    };
  }
}
