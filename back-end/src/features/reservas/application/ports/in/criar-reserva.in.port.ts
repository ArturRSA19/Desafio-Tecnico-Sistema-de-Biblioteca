import { CriarReservaInDto } from '../../dto/in/criar-reserva.in.dto';
import { ReservaOutDto } from '../../dto/out/reserva.out.dto';

export interface CriarReservaInPort {
  execute(input: CriarReservaInDto): Promise<ReservaOutDto>;
}
