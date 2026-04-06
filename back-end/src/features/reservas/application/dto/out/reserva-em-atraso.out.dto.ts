import { ReservaOutDto } from './reserva.out.dto';

export interface ReservaEmAtrasoOutDto extends ReservaOutDto {
  diasDeAtraso: number;
  multaTotal: number;
}
