import { Inject, Injectable } from '@nestjs/common';
import { ClienteNaoEncontradoError } from '../../domain/exceptions';
import type { BuscarReservasPorClienteInPort } from '../ports/in/buscar-reservas-por-cliente.in.port';
import type { ReservaRepositoryOutPort } from '../ports/out/reserva-repository.out.port';
import type { ClienteRepositoryOutPort } from '../ports/out/cliente-repository.out.port';
import { ReservasPorClienteOutDto } from '../dto/out/reservas-por-cliente.out.dto';
import { ReservaMapper } from '../mappers/reserva.mapper';

@Injectable()
export class BuscarReservasPorClienteUseCase implements BuscarReservasPorClienteInPort {
  constructor(
    @Inject('ReservaRepositoryOutPort')
    private readonly reservaRepository: ReservaRepositoryOutPort,
    @Inject('ClienteRepositoryOutPort')
    private readonly clienteRepository: ClienteRepositoryOutPort,
  ) {}

  async execute(clienteId: string): Promise<ReservasPorClienteOutDto[]> {
    const cliente = await this.clienteRepository.buscarPorId(clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(clienteId);
    }

    const reservas = await this.reservaRepository.buscarPorCliente(clienteId);
    return reservas.map((r) => ReservaMapper.toOutDto(r.comClienteSnapshot()));
  }
}
