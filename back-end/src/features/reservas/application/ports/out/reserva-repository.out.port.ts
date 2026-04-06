import { Reserva } from '../../../domain/entities/reserva.entity';

export interface CriarReservaData {
  clienteId: string;
  clienteNome: string;
  clienteCpf: string;
  livroId: string;
  dataReserva: Date;
  dataPrevistaDevolucao: Date;
}

export interface ReservaRepositoryOutPort {
  criar(data: CriarReservaData): Promise<Reserva>;
  buscarPorId(id: string): Promise<Reserva | null>;
  buscarTodas(): Promise<Reserva[]>;
  buscarPorCliente(clienteId: string): Promise<Reserva[]>;
  buscarEmAtraso(dataAtual: Date): Promise<Reserva[]>;
  atualizarDevolucao(id: string, dataDevolucao: Date): Promise<Reserva>;
}
