export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
}

export interface CreateClienteDto {
  nome: string;
  cpf: string;
  telefone: string;
}

export interface UpdateClienteDto {
  nome?: string;
  cpf?: string;
  telefone?: string;
}
