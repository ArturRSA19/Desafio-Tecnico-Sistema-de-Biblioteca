import { ReservaOutDto } from '../../dto/out/reserva.out.dto';

export interface BuscarTodasReservasInPort {
  execute(): Promise<ReservaOutDto[]>;
}
