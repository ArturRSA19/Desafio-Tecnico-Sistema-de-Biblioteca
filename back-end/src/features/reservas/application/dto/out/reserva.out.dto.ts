export interface ClienteSnapshotOutDto {
  id: string | null;
  nome: string;
  cpf: string;
}

export interface LivroSnapshotOutDto {
  id: string;
  titulo: string;
  autor: string;
  disponivel?: boolean;
}

export interface ReservaOutDto {
  id?: string;
  clienteId: string | null;
  clienteNome?: string | null;
  clienteCpf?: string | null;
  livroId: string;
  dataReserva: Date;
  dataPrevistaDevolucao: Date;
  dataDevolucao?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  cliente?: ClienteSnapshotOutDto | null;
  livro?: LivroSnapshotOutDto | null;
}
