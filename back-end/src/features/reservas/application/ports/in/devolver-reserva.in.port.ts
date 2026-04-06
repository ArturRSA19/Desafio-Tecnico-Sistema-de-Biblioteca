import { ReservaOutDto } from '../../dto/out/reserva.out.dto';

export interface DevolverReservaInPort {
  execute(reservaId: string): Promise<ReservaOutDto>;
}
