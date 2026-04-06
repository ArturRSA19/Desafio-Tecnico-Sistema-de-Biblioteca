import { ReservaOutDto } from '../../dto/out/reserva.out.dto';

export interface BuscarReservaInPort {
  execute(id: string): Promise<ReservaOutDto>;
}
