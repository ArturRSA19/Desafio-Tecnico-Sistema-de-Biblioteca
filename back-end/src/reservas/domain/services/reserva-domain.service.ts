import { Inject, Injectable } from '@nestjs/common';
import { Reserva } from '../entities/reserva.entity';
import type { ReservaRepositoryPort } from '../ports/reserva-repository.port';
import type { LivroRepositoryPort } from '../ports/livro-repository.port';
import type { ClienteRepositoryPort } from '../ports/cliente-repository.port';
import type { AuditLoggerPort } from '../ports/audit-logger.port';
import {
  ClienteNaoEncontradoError,
  LivroNaoEncontradoError,
  LivroIndisponivelError,
  DataDevolucaoInvalidaError,
  ReservaNaoEncontradaError,
  ReservaJaDevolvidaError,
} from '../exceptions';

export interface CreateReservaInput {
  clienteId: string;
  livroId: string;
  dataReserva: string;
  dataPrevistaDevolucao: string;
}

@Injectable()
export class ReservaDomainService {
  constructor(
    @Inject('ReservaRepositoryPort')
    private readonly reservaRepository: ReservaRepositoryPort,
    @Inject('LivroRepositoryPort')
    private readonly livroRepository: LivroRepositoryPort,
    @Inject('ClienteRepositoryPort')
    private readonly clienteRepository: ClienteRepositoryPort,
    @Inject('AuditLoggerPort')
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  async create(input: CreateReservaInput) {
    const { clienteId, livroId, dataReserva, dataPrevistaDevolucao } = input;

    const cliente = await this.clienteRepository.buscarPorId(clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(clienteId);
    }

    const livro = await this.livroRepository.buscarPorId(livroId);
    if (!livro) {
      throw new LivroNaoEncontradoError(livroId);
    }

    if (!livro.estaDisponivel()) {
      throw new LivroIndisponivelError();
    }

    const dataReservaDate = new Date(dataReserva);
    const dataPrevistaDevolucaoDate = new Date(dataPrevistaDevolucao);

    if (!Reserva.validarDatas(dataReservaDate, dataPrevistaDevolucaoDate)) {
      throw new DataDevolucaoInvalidaError();
    }

    const reserva = await this.reservaRepository.criar({
      clienteId,
      clienteNome: cliente.nome,
      clienteCpf: cliente.cpf,
      livroId,
      dataReserva: dataReservaDate,
      dataPrevistaDevolucao: dataPrevistaDevolucaoDate,
    });

    await this.livroRepository.atualizarDisponibilidade(livroId, false);

    this.auditLogger.logEvent('RESERVA_LIVRO', reserva.id!, {
      clienteId: reserva.clienteId,
      clienteNome: reserva.clienteNome,
      livroId: reserva.livroId,
      livroTitulo: reserva.livro?.titulo,
      dataReserva: reserva.dataReserva,
      dataPrevistaDevolucao: reserva.dataPrevistaDevolucao,
    });

    return reserva;
  }

  async findAll() {
    const reservas = await this.reservaRepository.buscarTodas();
    return reservas.map((r) => r.comClienteSnapshot());
  }

  async findByCliente(clienteId: string) {
    const cliente = await this.clienteRepository.buscarPorId(clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(clienteId);
    }

    const reservas = await this.reservaRepository.buscarPorCliente(clienteId);
    return reservas.map((r) => r.comClienteSnapshot());
  }

  async findOne(id: string) {
    const reserva = await this.reservaRepository.buscarPorId(id);
    if (!reserva) {
      throw new ReservaNaoEncontradaError(id);
    }

    return reserva.comClienteSnapshot();
  }

  async devolver(reservaId: string) {
    const reserva = await this.reservaRepository.buscarPorId(reservaId);
    if (!reserva) {
      throw new ReservaNaoEncontradaError(reservaId);
    }

    if (reserva.estaDevolvida()) {
      throw new ReservaJaDevolvidaError();
    }

    const dataDevolucao = new Date();

    const reservaAtualizada = await this.reservaRepository.atualizarDevolucao(
      reservaId,
      dataDevolucao,
    );

    await this.livroRepository.atualizarDisponibilidade(
      reserva.livroId,
      true,
    );

    this.auditLogger.logEvent('DEVOLUCAO_LIVRO', reservaId, {
      clienteId: reservaAtualizada.clienteId,
      clienteNome: reservaAtualizada.clienteNome,
      livroId: reservaAtualizada.livroId,
      livroTitulo: reservaAtualizada.livro?.titulo,
      dataDevolucao,
    });

    return reservaAtualizada;
  }

  async findEmAtraso() {
    const dataAtual = new Date();

    const reservas = await this.reservaRepository.buscarEmAtraso(dataAtual);

    return reservas.map((reserva) => {
      const snapshot = reserva.comClienteSnapshot();
      const { diasDeAtraso, multaTotal } = reserva.calcularMulta(dataAtual);

      return {
        ...snapshot.toPlain(),
        diasDeAtraso,
        multaTotal,
      };
    });
  }
}
