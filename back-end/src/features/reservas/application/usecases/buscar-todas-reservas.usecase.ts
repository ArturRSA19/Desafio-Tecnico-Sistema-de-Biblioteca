import { Inject, Injectable } from '@nestjs/common';
import type { BuscarTodasReservasInPort } from '../ports/in/buscar-todas-reservas.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import { ReservaOutDto } from '../dto/out/reserva.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class BuscarTodasReservasUseCase implements BuscarTodasReservasInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
  ) {}

  async execute(): Promise<ReservaOutDto[]> {
    const reservas = await this.reservaRepository.buscarTodas();
    return reservas.map((r) => ReservaMapper.toOutDto(r.comClienteSnapshot()));
  }
}
