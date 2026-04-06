import { ReservaEmAtrasoOutDto } from '../../dto/out/reserva-em-atraso.out.dto';

export interface BuscarReservasEmAtrasoInPort {
  execute(): Promise<ReservaEmAtrasoOutDto[]>;
}
