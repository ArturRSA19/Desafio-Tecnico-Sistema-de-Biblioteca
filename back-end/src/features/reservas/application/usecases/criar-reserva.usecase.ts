import { Inject, Injectable } from '@nestjs/common';
import { Reserva } from '../../domain/entities/reserva.entity';
import {
  ClienteNaoEncontradoError,
  LivroNaoEncontradoError,
  LivroIndisponivelError,
  DataDevolucaoInvalidaError,
} from '../../domain/exceptions';
import type { CriarReservaInPort } from '../ports/in/criar-reserva.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import type { LivroRepositoryOutPort } from '../ports/out/livro-repository.out.port';
import type { ClienteRepositoryOutPort } from '../ports/out/cliente-repository.out.port';
import type { AuditLoggerOutPort } from '../ports/out/audit-logger.out.port';
import { CriarReservaInDto } from '../dto/in/criar-reserva.in.dto';
import { ReservaOutDto } from '../dto/out/reserva.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class CriarReservaUseCase implements CriarReservaInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
    @Inject('LivroRepositoryOutPort')
    private readonly livroRepository: LivroRepositoryOutPort,
    @Inject('ClienteRepositoryOutPort')
    private readonly clienteRepository: ClienteRepositoryOutPort,
    @Inject('AuditLoggerOutPort')
    private readonly auditLogger: AuditLoggerOutPort,
  ) {}

  async execute(input: CriarReservaInDto): Promise<ReservaOutDto> {
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

    return ReservaMapper.toOutDto(reserva);
  }
}
