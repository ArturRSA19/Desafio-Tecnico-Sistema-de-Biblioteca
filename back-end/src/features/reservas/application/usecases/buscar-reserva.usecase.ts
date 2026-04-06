import { Inject, Injectable } from '@nestjs/common';
import { ReservaNaoEncontradaError } from '../../domain/exceptions';
import type { BuscarReservaInPort } from '../ports/in/buscar-reserva.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import { ReservaOutDto } from '../dto/out/reserva.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class BuscarReservaUseCase implements BuscarReservaInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
  ) {}

  async execute(id: string): Promise<ReservaOutDto> {
    const reserva = await this.reservaRepository.buscarPorId(id);
    if (!reserva) {
      throw new ReservaNaoEncontradaError(id);
    }

    return ReservaMapper.toOutDto(reserva.comClienteSnapshot());
  }
}
