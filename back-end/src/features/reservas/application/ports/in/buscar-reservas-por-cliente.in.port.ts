import { ReservasPorClienteOutDto } from '../../dto/out/reservas-por-cliente.out.dto';

export interface BuscarReservasPorClienteInPort {
  execute(clienteId: string): Promise<ReservasPorClienteOutDto[]>;
}
