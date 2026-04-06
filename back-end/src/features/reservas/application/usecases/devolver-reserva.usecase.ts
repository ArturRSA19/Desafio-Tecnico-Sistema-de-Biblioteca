import { Inject, Injectable } from '@nestjs/common';
import {
  ReservaNaoEncontradaError,
  ReservaJaDevolvidaError,
} from '../../domain/exceptions';
import type { DevolverReservaInPort } from '../ports/in/devolver-reserva.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import type { LivroRepositoryOutPort } from '../ports/out/livro-repository.out.port';
import type { AuditLoggerOutPort } from '../ports/out/audit-logger.out.port';
import { ReservaOutDto } from '../dto/out/reserva.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class DevolverReservaUseCase implements DevolverReservaInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
    @Inject('LivroRepositoryOutPort')
    private readonly livroRepository: LivroRepositoryOutPort,
    @Inject('AuditLoggerOutPort')
    private readonly auditLogger: AuditLoggerOutPort,
  ) {}

  async execute(reservaId: string): Promise<ReservaOutDto> {
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

    return ReservaMapper.toOutDto(reservaAtualizada);
  }
}
