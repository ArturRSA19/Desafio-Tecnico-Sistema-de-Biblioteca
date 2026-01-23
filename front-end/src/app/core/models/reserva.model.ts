import { Cliente } from './cliente.model';
import { Livro } from './livro.model';

export interface Reserva {
  id: string;
  clienteId: string;
  livroId: string;
  dataReserva: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  cliente: Cliente;
  livro: Livro;
  multa?: number;
  diasDeAtraso?: number;
}

export interface CreateReservaDto {
  clienteId: string;
  livroId: string;
  dataReserva: string;
  dataPrevistaDevolucao: string;
}
