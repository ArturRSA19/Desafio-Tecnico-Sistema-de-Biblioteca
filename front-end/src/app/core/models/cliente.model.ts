export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
}

export interface CreateClienteDto {
  nome: string;
  cpf: string;
}

export interface UpdateClienteDto {
  nome?: string;
  cpf?: string;
}
