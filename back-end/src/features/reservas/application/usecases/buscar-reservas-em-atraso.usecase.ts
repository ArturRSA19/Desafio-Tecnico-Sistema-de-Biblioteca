import { Inject, Injectable } from '@nestjs/common';
import type { BuscarReservasEmAtrasoInPort } from '../ports/in/buscar-reservas-em-atraso.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import { ReservaEmAtrasoOutDto } from '../dto/out/reserva-em-atraso.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class BuscarReservasEmAtrasoUseCase implements BuscarReservasEmAtrasoInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
  ) {}

  async execute(): Promise<ReservaEmAtrasoOutDto[]> {
    const dataAtual = new Date();

    const reservas = await this.reservaRepository.buscarEmAtraso(dataAtual);

    return reservas.map((reserva) => {
      const snapshot = reserva.comClienteSnapshot();
      const { diasDeAtraso, multaTotal } = reserva.calcularMulta(dataAtual);

      return ReservaMapper.toEmAtrasoOutDto(snapshot, diasDeAtraso, multaTotal);
    });
  }
}
